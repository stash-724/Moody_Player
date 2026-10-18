// Temporal smoothing for per-frame emotion probabilities.
//
// A single frame is noisy (blinks, motion blur, mid-word mouth shapes), so the raw argmax
// flickers. An exponential moving average blends each new frame into a running estimate:
//   smoothed_t = alpha * probs_t + (1 - alpha) * smoothed_(t-1)
// At ~5 fps, alpha = 0.3 gives a time constant of about 1 / alpha ≈ 3 frames (~0.7 s).
// On top of that, the reported mood only changes when the smoothed top probability clears
// a confidence threshold; otherwise the previous mood is kept.
export function argmax(values) {
  let best = 0;
  for (let i = 1; i < values.length; i++) if (values[i] > values[best]) best = i;
  return best;
}

export function createMoodSmoother({ alpha = 0.3, threshold = 0.5, resetAfterMissed = 10 } = {}) {
  let smoothed = null;
  let mood = null;
  let missed = 0;

  return {
    // probs: array of class probabilities for this frame, or null when no face was found.
    update(probs) {
      if (!probs) {
        missed += 1;
        // After ~2 s without a face, forget the stale average but keep showing the last mood.
        if (missed >= resetAfterMissed) smoothed = null;
        return { smoothed, mood, confident: false, face: false };
      }
      missed = 0;
      smoothed = smoothed
        ? smoothed.map((s, i) => alpha * probs[i] + (1 - alpha) * s)
        : Array.from(probs);
      const top = argmax(smoothed);
      const confident = smoothed[top] >= threshold;
      if (confident) mood = top;
      return { smoothed, mood, confident, face: true };
    },
    reset() {
      smoothed = null;
      mood = null;
      missed = 0;
    },
  };
}
