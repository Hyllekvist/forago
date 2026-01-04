// src/workers/vision.worker.ts
/// <reference lib="webworker" />

import * as ort from "onnxruntime-web";

/**
 * Worker: embedding + cosine ranking
 * - cacher embeddings pr. slug i memory (session)
 * - henter refs (image_url) i client og sender med ind
 *
 * Forventning:
 * - ONNX model ligger tilgængelig via URL (default nedenfor)
 * - modellen outputter en 1D embedding (f.eks. 512/768/1024)
 */

type RefIn = {
  slug: string;
  scientific_name: string;
  group: string;
  image_url: string;
};

type RankMsg = {
  type: "rank";
  id: string;
  topK: number;
  file: File;
  refs: RefIn[];
};

type ProgressMsg = { type: "progress"; id?: string; text: string };
type RankOkMsg = {
  type: "rank:ok";
  id: string;
  candidates: { slug: string; scientific_name: string; group: string; score: number }[];
};
type RankErrMsg = { type: "rank:error"; id: string; error: string };

const post = (m: ProgressMsg | RankOkMsg | RankErrMsg) => (self as any).postMessage(m);

// ---------- Model config ----------
const MODEL_URL = "/models/vision-embed.onnx"; // hvis du allerede har en anden, så peg den her
const INPUT_SIZE = 224; // typisk 224; ændr hvis din model kræver andet
const INPUT_NAME = "pixel_values"; // fallback, vi finder det dynamisk hvis det ikke matcher

let session: ort.InferenceSession | null = null;
let resolvedInputName: string | null = null;

// slug -> embedding
const embedCache = new Map<string, Float32Array>();
// url -> blob cache (undgå gentagne fetch)
const urlBlobCache = new Map<string, Blob>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureSession() {
  if (session) return session;

  // safe defaults
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;

  // Vælg wasm (stabilt). WebGPU kan komme senere.
  session = await ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });

  // find input name
  const inputs = (session as any).inputNames as string[] | undefined;
  if (inputs && inputs.length) {
    resolvedInputName = inputs.includes(INPUT_NAME) ? INPUT_NAME : inputs[0];
  } else {
    resolvedInputName = INPUT_NAME;
  }

  return session;
}

// ---------- Image utils ----------
async function fileToImageBitmap(file: File): Promise<ImageBitmap> {
  // createImageBitmap er hurtig og worker-friendly
  return await createImageBitmap(file);
}

async function urlToBlob(url: string): Promise<Blob> {
  const cached = urlBlobCache.get(url);
  if (cached) return cached;

  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`FETCH_FAIL ${res.status}`);
  const blob = await res.blob();
  urlBlobCache.set(url, blob);
  return blob;
}

async function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  return await createImageBitmap(blob);
}

function centerCropAndResizeToCanvas(bm: ImageBitmap, size: number): OffscreenCanvas {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("NO_CTX");

  const w = bm.width;
  const h = bm.height;
  const s = Math.min(w, h);

  const sx = Math.max(0, Math.floor((w - s) / 2));
  const sy = Math.max(0, Math.floor((h - s) / 2));

  ctx.drawImage(bm, sx, sy, s, s, 0, 0, size, size);
  return canvas;
}

function canvasToFloat32CHW(canvas: OffscreenCanvas): Float32Array {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("NO_CTX");

  const { width, height } = canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const data = img.data;

  // normalisering: 0..1 (konservativt). Hvis din model kræver mean/std, så ændr her.
  const hw = width * height;
  const out = new Float32Array(3 * hw);

  let j = 0;
  for (let i = 0; i < hw; i++) {
    const r = data[j++] / 255;
    const g = data[j++] / 255;
    const b = data[j++] / 255;
    j++; // alpha

    out[i] = r;
    out[i + hw] = g;
    out[i + 2 * hw] = b;
  }
  return out;
}

function l2Normalize(v: Float32Array): Float32Array {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i] * v[i];
  const norm = Math.sqrt(s) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

function cosine(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

// ---------- Embedding ----------
async function embedBitmap(bm: ImageBitmap): Promise<Float32Array> {
  const s = await ensureSession();

  const canvas = centerCropAndResizeToCanvas(bm, INPUT_SIZE);
  const chw = canvasToFloat32CHW(canvas);

  const inputName = resolvedInputName || INPUT_NAME;
  const tensor = new ort.Tensor("float32", chw, [1, 3, INPUT_SIZE, INPUT_SIZE]);
  const feeds: Record<string, ort.Tensor> = { [inputName]: tensor };

  const out = await s.run(feeds);
  const firstKey = Object.keys(out)[0];
  if (!firstKey) throw new Error("NO_OUTPUT");

  const t = out[firstKey] as ort.Tensor;
  const arr = t.data as Float32Array;

  // normalize så cosine giver stabil score
  return l2Normalize(arr);
}

async function embedFile(file: File): Promise<Float32Array> {
  const bm = await fileToImageBitmap(file);
  try {
    return await embedBitmap(bm);
  } finally {
    bm.close();
  }
}

async function embedRef(ref: RefIn): Promise<Float32Array> {
  const cached = embedCache.get(ref.slug);
  if (cached) return cached;

  const blob = await urlToBlob(ref.image_url);
  const bm = await blobToImageBitmap(blob);
  try {
    const e = await embedBitmap(bm);
    embedCache.set(ref.slug, e);
    return e;
  } finally {
    bm.close();
  }
}

// ---------- Ranking ----------
async function rank(id: string, file: File, refs: RefIn[], topK: number) {
  post({ type: "progress", id, text: "Læser billede…" });
  const q = await embedFile(file);

  post({ type: "progress", id, text: "Matcher mod reference-arter…" });

  // enkel throttling så mobil ikke dør
  const CONCURRENCY = 3;
  const scored: { slug: string; scientific_name: string; group: string; score: number }[] = [];

  let idx = 0;
  async function workerLoop() {
    while (idx < refs.length) {
      const i = idx++;
      const r = refs[i];

      try {
        const e = await embedRef(r);
        const s = cosine(q, e);
        scored.push({
          slug: r.slug,
          scientific_name: r.scientific_name,
          group: r.group,
          score: s,
        });
      } catch {
        // skip fejlende refs
      }

      // små pauser gør det “smooth” på iPhone
      if (i % 24 === 0) await sleep(1);
    }
  }

  const loops = Array.from({ length: Math.min(CONCURRENCY, refs.length) }, () => workerLoop());
  await Promise.all(loops);

  scored.sort((a, b) => b.score - a.score);

  const out = scored.slice(0, Math.max(1, topK));
  post({ type: "rank:ok", id, candidates: out });
}

// ---------- Message handler ----------
self.addEventListener("message", async (ev: MessageEvent) => {
  const msg = ev.data as RankMsg;
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "rank") {
    const { id, file, refs, topK } = msg;
    try {
      await rank(id, file, refs || [], topK || 10);
    } catch (e: any) {
      post({ type: "rank:error", id, error: e?.message ?? "RANK_FAILED" });
    }
  }
});
