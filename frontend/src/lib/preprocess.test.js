import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { rgbaToInput, squareCrop, INPUT_SIZE } from "./preprocess.js";
import { loadEmotionModel, softmax } from "./emotionModel.js";

test("rgbaToInput matches PIL's 8-bit BT.601 luma, scaled to [0, 1]", () => {
  const rgba = new Uint8ClampedArray(INPUT_SIZE * INPUT_SIZE * 4);
  rgba.set([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
  const x = rgbaToInput(rgba);
  assert.equal(x.length, 48 * 48);
  // PIL: Image.new("RGB", (1, 1), c).convert("L") gives 76, 150, 29, 255 for red, green, blue, white.
  assert.deepEqual(Array.from(x.slice(0, 4), (v) => Math.round(v * 255)), [76, 150, 29, 255]);
});

test("squareCrop widens the box, stays square and inside the frame", () => {
  const c = squareCrop({ x: 600, y: 10, width: 100, height: 120 }, 640, 480);
  assert.ok(Math.abs(c.side - 138) < 1e-9);
  assert.equal(c.sx, 640 - c.side); // centre would overflow the right edge, so it is clamped
  assert.ok(Math.abs(c.sy - 1) < 1e-9); // centred vertically: 70 - 138 / 2
});

test("softmax sums to 1 and is shift-invariant", () => {
  const p = softmax([1, 2, 3]);
  assert.ok(Math.abs(p.reduce((a, b) => a + b) - 1) < 1e-12);
  assert.deepEqual(softmax([101, 102, 103]).map((v) => v.toFixed(12)), p.map((v) => v.toFixed(12)));
});

test("onnxruntime-web reproduces the Python onnxruntime output", async () => {
  const fixture = JSON.parse(await readFile(new URL("./__fixtures__/parity.json", import.meta.url)));
  const meta = JSON.parse(await readFile(new URL("../../public/models/emotion_meta.json", import.meta.url)));
  const modelSource = new Uint8Array(await readFile(new URL("../../public/models/emotion_model.onnx", import.meta.url)));
  const model = await loadEmotionModel({ modelSource, meta });
  const { probs } = await model.classify(rgbaToInput(Uint8ClampedArray.from(fixture.rgba)));
  const maxDiff = Math.max(...probs.map((p, i) => Math.abs(p - fixture.expected_probs[i])));
  assert.ok(maxDiff < 1e-4, `max prob diff ${maxDiff}`);
});
