import { test } from "node:test";
import assert from "node:assert/strict";
import { createMoodSmoother, argmax } from "./smoothing.js";

const happy = [0.05, 0, 0.05, 0.8, 0.05, 0, 0.05];
const sad = [0.05, 0, 0.05, 0.05, 0.8, 0, 0.05];

test("argmax returns the index of the largest value", () => {
  assert.equal(argmax([0.1, 0.7, 0.2]), 1);
});

test("first confident frame sets the mood", () => {
  const s = createMoodSmoother({ alpha: 0.3, threshold: 0.5 });
  const r = s.update(happy);
  assert.equal(r.mood, 3);
  assert.equal(r.confident, true);
});

test("a single contradicting frame does not flip the mood", () => {
  const s = createMoodSmoother({ alpha: 0.3, threshold: 0.5 });
  for (let i = 0; i < 5; i++) s.update(happy);
  const r = s.update(sad);
  assert.equal(r.mood, 3);
  assert.ok(r.smoothed[3] > r.smoothed[4]);
});

test("a sustained change does flip the mood", () => {
  const s = createMoodSmoother({ alpha: 0.3, threshold: 0.5 });
  for (let i = 0; i < 5; i++) s.update(happy);
  let r;
  for (let i = 0; i < 6; i++) r = s.update(sad);
  assert.equal(r.mood, 4);
});

test("low-confidence frames keep the previous mood", () => {
  const s = createMoodSmoother({ alpha: 1, threshold: 0.5 });
  s.update(happy);
  const r = s.update([0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.1]);
  assert.equal(r.confident, false);
  assert.equal(r.mood, 3);
});

test("missing faces reset the average after the limit but keep the mood", () => {
  const s = createMoodSmoother({ resetAfterMissed: 3 });
  s.update(happy);
  s.update(null);
  s.update(null);
  const r = s.update(null);
  assert.equal(r.smoothed, null);
  assert.equal(r.face, false);
  assert.equal(r.mood, 3);
});

test("the EMA follows the formula", () => {
  const s = createMoodSmoother({ alpha: 0.25 });
  s.update([1, 0]);
  const r = s.update([0, 1]);
  assert.deepEqual(r.smoothed, [0.75, 0.25]);
});
