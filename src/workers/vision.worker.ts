/// <reference lib="webworker" />

import * as ort from "onnxruntime-web";

type Msg =
  | { type: "init"; modelUrl: string }
  | { type: "embed_url"; id: string; imageUrl: string }
  | { type: "embed_blob"; id: string; data: ArrayBuffer };

type Reply =
  | { type: "ready" }
  | { type: "embed_ok"; id: string; vec: number[] }
  | { type: "err"; id?: string; error: string };

let session: ort.InferenceSession | null = null;

function post(msg: Reply) {
  (self as any).postMessage(msg);
}

async function loadImageToImageDataFromUrl(url: string) {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error("REF_IMAGE_FETCH_FAILED");
  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(224, 224);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("NO_CTX");
  ctx.drawImage(bmp, 0, 0, 224, 224);
  return ctx.getImageData(0, 0, 224, 224);
}

async function loadImageToImageDataFromBlob(buf: ArrayBuffer) {
  const blob = new Blob([buf]);
  const bmp = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(224, 224);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("NO_CTX");
  ctx.drawImage(bmp, 0, 0, 224, 224);
  return ctx.getImageData(0, 0, 224, 224);
}

function imageDataToTensor(img: ImageData) {
  // NCHW float32, normalize 0..1
  const { data, width, height } = img;
  const size = width * height;
  const out = new Float32Array(3 * size);

  for (let i = 0; i < size; i++) {
    const r = data[i * 4 + 0] / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;

    out[i] = r;
    out[i + size] = g;
    out[i + 2 * size] = b;
  }

  return new ort.Tensor("float32", out, [1, 3, height, width]);
}

// prøv at finde første input/output uden at hardcode navn
function pickIO(s: ort.InferenceSession) {
  const inputName = s.inputNames[0];
  const outputName = s.outputNames[0];
  return { inputName, outputName };
}

async function embed(t: ort.Tensor) {
  if (!session) throw new Error("NOT_READY");
  const { inputName, outputName } = pickIO(session);
  const feeds: Record<string, ort.Tensor> = { [inputName]: t };
  const res = await session.run(feeds);
  const out = res[outputName];
  const vec = Array.from(out.data as any as Float32Array);
  return vec;
}

self.onmessage = async (ev: MessageEvent<Msg>) => {
  try {
    const msg = ev.data;

    if (msg.type === "init") {
      // CDN WASM (ingen kopiering til public)
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/";
      ort.env.wasm.numThreads = 1;

      // WebGPU hvis muligt; fallback til wasm
      const providers: ort.InferenceSession.SessionOptions["executionProviders"] = ["webgpu", "wasm"];
      session = await ort.InferenceSession.create(msg.modelUrl, {
        executionProviders: providers,
        graphOptimizationLevel: "all",
      });

      post({ type: "ready" });
      return;
    }

    if (msg.type === "embed_url") {
      const img = await loadImageToImageDataFromUrl(msg.imageUrl);
      const tensor = imageDataToTensor(img);
      const vec = await embed(tensor);
      post({ type: "embed_ok", id: msg.id, vec });
      return;
    }

    if (msg.type === "embed_blob") {
      const img = await loadImageToImageDataFromBlob(msg.data);
      const tensor = imageDataToTensor(img);
      const vec = await embed(tensor);
      post({ type: "embed_ok", id: msg.id, vec });
      return;
    }
  } catch (e: any) {
    post({ type: "err", id: (ev.data as any)?.id, error: e?.message ?? "WORKER_ERROR" });
  }
};
