// Runs the emotion classifier trained in ml/fer_train.ipynb (exported to ONNX) on-device
// with onnxruntime-web's WebAssembly backend.
import * as ort from "onnxruntime-web/wasm";

const BASE = import.meta.env?.BASE_URL ?? "/";
export const MODEL_URL = `${BASE}models/emotion_model.onnx`;
export const META_URL = `${BASE}models/emotion_meta.json`;

// Multi-threaded WASM needs cross-origin isolation (COOP/COEP headers); a single thread is
// plenty for a ~2 ms model and avoids the requirement.
ort.env.wasm.numThreads = 1;

export function softmax(logits) {
  let max = -Infinity;
  for (const v of logits) max = Math.max(max, v);
  const exps = Array.from(logits, (v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

// modelSource/meta are injectable so the same code can be tested under Node.
export async function loadEmotionModel({ modelSource = MODEL_URL, meta } = {}) {
  const [session, info] = await Promise.all([
    ort.InferenceSession.create(modelSource, { executionProviders: ["wasm"] }),
    meta ?? fetch(META_URL).then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${META_URL}: ${res.status}`);
      return res.json();
    }),
  ]);
  const { name: inputName, shape } = info.input;
  const outputName = info.output.name;

  return {
    labels: info.labels,
    async classify(input) {
      const t0 = performance.now();
      const results = await session.run({ [inputName]: new ort.Tensor("float32", input, shape) });
      return { probs: softmax(results[outputName].data), ms: performance.now() - t0 };
    },
  };
}
