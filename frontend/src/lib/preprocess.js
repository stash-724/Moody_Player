// Turns a detected face into the classifier's input: grayscale, 48x48, values in [0, 1].
// This must match training (ml/fer_train.ipynb, section 4). Mean/std normalisation is
// baked into the ONNX graph, so it is deliberately not done here.
export const INPUT_SIZE = 48;

// FER-2013 crops are square and include a little forehead and chin around the face,
// while the face detector's box is tighter, so the crop is widened slightly.
const CROP_MARGIN = 0.15;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

export function squareCrop(box, frameWidth, frameHeight, margin = CROP_MARGIN) {
  const side = Math.min(Math.max(box.width, box.height) * (1 + margin), frameWidth, frameHeight);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  return {
    sx: clamp(cx - side / 2, 0, frameWidth - side),
    sy: clamp(cy - side / 2, 0, frameHeight - side),
    side,
  };
}

// ITU-R BT.601 luma (0.299 R + 0.587 G + 0.114 B), computed exactly like PIL's
// convert("L"): fixed-point weights rounded to an 8-bit level. Training images were 8-bit
// grayscale, so this reproduces the training pixel values rather than a float approximation.
export function rgbaToInput(rgba, out = new Float32Array(INPUT_SIZE * INPUT_SIZE)) {
  for (let i = 0, j = 0; j < out.length; i += 4, j++) {
    out[j] = ((rgba[i] * 19595 + rgba[i + 1] * 38470 + rgba[i + 2] * 7471 + 0x8000) >> 16) / 255;
  }
  return out;
}

// Draws the face crop onto a 48x48 canvas (which the UI also shows as "what the model sees")
// and returns the model input.
export function faceToInput(video, box, ctx) {
  const { sx, sy, side } = squareCrop(box, video.videoWidth, video.videoHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(video, sx, sy, side, side, 0, 0, INPUT_SIZE, INPUT_SIZE);
  return rgbaToInput(ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data);
}
