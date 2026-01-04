// src/workers/vision.worker.ts
/* eslint-disable no-restricted-globals */

import type { InferenceSession } from "onnxruntime-web";

// NOTE:
// Denne worker kan køre uden ONNX-model (fallback embedding).
// Når I senere tilføjer en ONNX model, sæt MODEL_URL til fx "/models/vision.onnx"
// og opdater preprocess + output navne.

type InMsg = { type: "embed"; id: string; imageUrl: string; size?: number };
type OutMsg =
  | { type: "embed_result"; id: string; vector: number[] }
  | { type: "error"; id?: string; error: string };

const MODEL_URL: string | null = null; // <-- når I er klar: "/models/your_model.onnx"

let session: InferenceSession | null = null;

async function ensureSession() {
  if (!MODEL_URL) return null;
  if (session) return session;

  // dynamisk import for at undgå at Next prøver at optimere/minify den forkert i main bundle
  const ort = await import("onnxruntime-web");

  // hold jer til wasm i browseren (stabilt)
  ort.env.wasm.numThreads = 1;

  session = await ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });

  return session;
}

async function fetchImageBitmap(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FETCH_FAIL ${res.status}`);
  const blob = await res.blob();
  return await createImageBitmap(blob);
}

function drawToCanvas(bmp: ImageBitmap, size: number) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("NO_2D_CTX");
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(bmp, 0, 0, size, size);
  return { canvas, ctx };
}

/**
 * Fallback embedding:
 * - downsample til 32x32
 * - gråskala
 * - normaliser
 * Result: 1024 dims
 */
function fallbackEmbedFromImageData(img: ImageData) {
  const { data, width, height } = img;
  const out = new Float32Array(width * height);
  let j = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    // luminance
    out[j++] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  // center + scale (rough normalization)
  let mean = 0;
  for (let i = 0; i < out.length; i++) mean += out[i];
  mean /= out.length;

  let varSum = 0;
  for (let i = 0; i < out.length; i++) {
    const d = out[i] - mean;
    varSum += d * d;
  }
  const std = Math.sqrt(varSum / out.length) || 1;

  for (let i = 0; i < out.length; i++) out[i] = (out[i] - mean) / std;

  return out;
}

async function embed(imageUrl: string, size = 224) {
  const bmp = await fetchImageBitmap(imageUrl);

  // 1) ONNX path (hvis I sætter MODEL_URL)
  const s = await ensureSession();
  if (s) {
    const ort = await import("onnxruntime-web");

    const { ctx } = drawToCanvas(bmp, size);
    const img = ctx.getImageData(0, 0, size, size);
    const data = img.data;

    // Simple preprocess: NCHW float32 0..1
    // (I skal sandsynligvis ændre mean/std + inputName/outputName når model er kendt)
    const chw = new Float32Array(3 * size * size);
    const hw = size * size;

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      chw[p] = r;
      chw[hw + p] = g;
      chw[2 * hw + p] = b;
    }

    // input/output navn: prøv typiske defaults, ellers vælg første
    const inputName = (s as any).inputNames?.[0] ?? "input";
    const outputName = (s as any).outputNames?.[0] ?? "output";

    const feeds: Record<string, any> = {};
    feeds[inputName] = new ort.Tensor("float32", chw, [1, 3, size, size]);

    const results = await s.run(feeds);
    const out = results[outputName]?.data as Float32Array | undefined;
    if (!out || out.length === 0) throw new Error("EMPTY_MODEL_OUTPUT");

    // normaliser embedding
    let norm = 0;
    for (let i = 0; i < out.length; i++) norm += out[i] * out[i];
    norm = Math.sqrt(norm) || 1;

    const v = new Float32Array(out.length);
    for (let i = 0; i < out.length; i++) v[i] = out[i] / norm;

    return v;
  }

  // 2) fallback path
  const small = 32;
  const { ctx } = drawToCanvas(bmp, small);
  const img = ctx.getImageData(0, 0, small, small);
  const v = fallbackEmbedFromImageData(img);

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < v.length; i++) v[i] = v[i] / norm;

  return v;
}

self.onmessage = async (ev: MessageEvent<InMsg>) => {
  const msg = ev.data;
  if (!msg || msg.type !== "embed") return;

  try {
    const vec = await embed(msg.imageUrl, msg.size ?? 224);
    const out: OutMsg = { type: "embed_result", id: msg.id, vector: Array.from(vec) };
    self.postMessage(out);
  } catch (e: any) {
    const out: OutMsg = { type: "error", id: msg.id, error: e?.message ?? "WORKER_ERROR" };
    self.postMessage(out);
  }
};
