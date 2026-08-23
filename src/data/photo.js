// The profile photo lives in src/assets as real .jpg files rather than inline base64.
// Base64 costs a third more bytes, cannot be gzipped any further (JPEG is
// already compressed) and forced all 11 images into the main JS bundle, which
// had to finish downloading before anything rendered. As files, Vite hashes
// them, the browser caches and decodes them in parallel, and they never block
// first paint.
import peterMonev from "../assets/peter-monev.jpg";

export const PHOTO_SRC = peterMonev;
