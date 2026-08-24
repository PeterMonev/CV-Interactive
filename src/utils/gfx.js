import * as THREE from "three";

// Shared render-quality settings. Ten scenes each build their own renderer, so
// without a single place to set these they drift apart the moment one is edited.
//
// Note on colour space: three r152+ already defaults outputColorSpace to sRGB
// and enables colour management, so that needs no help. What is still off by
// default is everything below.

let maxAnisotropy = 1;

// Tone mapping travels with bloom, and only with bloom.
//
// Its job is to compress a range wider than the screen can show, which is
// exactly what a bloomed scene produces and exactly what the others do not.
// Every scene here draws palette colours directly — a cyan wireframe, additive
// glow sprites, text baked into a canvas — and ACES pushes those far enough up
// its curve to desaturate them towards white. Measured on the site's own cyan:
// 0,229,255 raw against 168,231,235 tone mapped, a drop from full saturation to
// 29%. That is why the cursor, the scroll button and the stats field all went
// pale. So it is off unless a scene asks, and only the two bloomed scenes do.
export function tuneRenderer(renderer, { toneMap = false } = {}) {
  if (!toneMap) {
    maxAnisotropy = Math.max(maxAnisotropy, renderer.capabilities.getMaxAnisotropy());
    return renderer;
  }
  // Neon on near-black is exactly the case tone mapping exists for. With
  // NoToneMapping — the default — anything brighter than 1.0 is clipped flat,
  // so saturated cyan and magenta lose their cores and gradients band. ACES
  // rolls the highlights off instead of cutting them.
  //
  // The exposure is above 1 on purpose: ACES darkens midtones, and every colour
  // in these scenes was picked by eye against an untonemapped render. Measured
  // against the original output, 1.45 lands the mid greys back where they were
  // while the highlights keep their new roll-off.
  renderer.toneMappingExposure = 1.45;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  maxAnisotropy = Math.max(maxAnisotropy, renderer.capabilities.getMaxAnisotropy());
  return renderer;
}

// Canvas-drawn labels are read at glancing angles inside the rotating clusters,
// which is precisely where a texture filtered without anisotropy smears into
// mush. Hardware here reports 16; the three default is 1.
//
// srgb is opt-in rather than the default, which looks backwards until you ask
// what the source actually is. A photograph genuinely carries sRGB values and
// must be declared so. The canvas textures here do not: their colours were
// chosen by eye against a pipeline that did no conversion, so declaring them
// sRGB does not correct them — it darkens every one of them by roughly five
// times, which is exactly what happened to the certificate cards. Marking them
// would only be right after re-authoring every colour in this file.
export function tuneTexture(texture, { srgb = false } = {}) {
  texture.anisotropy = maxAnisotropy;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// Text baked into a canvas at CSS resolution is soft on any HiDPI screen. Draw
// it larger and let the GPU scale down — capped at 2 so a 3x phone does not pay
// for a texture nobody can resolve.
export const texturePixelRatio = () =>
  Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 2);
