import * as THREE from "three";
import { tuneTexture, texturePixelRatio } from "./gfx.js";

// Back a canvas with more device pixels than CSS pixels and scale the context to
// match, so every drawing call below keeps working in logical units while the
// texture itself carries enough detail to stay sharp on a HiDPI screen.
function hidpiCanvas(cssWidth, cssHeight) {
  const dpr = texturePixelRatio();
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(cssWidth * dpr);
  canvas.height = Math.ceil(cssHeight * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return { canvas, ctx, width: cssWidth, height: cssHeight };
}

export function makeLabelSprite(text, colorHex) {
  const { canvas, ctx, width, height } = hidpiCanvas(320, 76);
  ctx.font = "600 38px 'JetBrains Mono', monospace";
  ctx.fillStyle = colorHex;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);
  const texture = tuneTexture(new THREE.CanvasTexture(canvas));
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.7, 0.4, 1);
  return sprite;
}


export function makeGlowSpriteTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const gctx = c.getContext("2d");
  const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(238,241,251,0.95)");
  grad.addColorStop(0.4, "rgba(238,241,251,0.35)");
  grad.addColorStop(1, "rgba(238,241,251,0)");
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 128, 128);
  return tuneTexture(new THREE.CanvasTexture(c));
}


// A cloud rather than a dot.
//
// The obvious way to place a nebula is the glow sprite above, but that is one
// radial gradient — a perfect circle, which the eye reads as a point of light
// however large and dim it is made. Real interstellar cloud is lumpy and
// stretched. This scatters several dozen soft blobs along a horizontal band,
// with the vertical spread kept much tighter than the horizontal one, so the
// result already leans sideways before the sprite is stretched any further.
//
// The randomness is seeded. A cloud that reshuffles itself every time the scene
// is rebuilt — a language switch, a recovered context — would visibly flicker.
export function makeNebulaTexture(seed = 1) {
  const W = 512;
  const H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // small deterministic generator: same seed, same cloud, every time
  let state = seed * 9301 + 49297;
  const rand = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };

  const BLOBS = 46;
  for (let i = 0; i < BLOBS; i++) {
    // bunched toward the middle of the band, trailing off at the ends
    const t = rand();
    const x = W * (0.5 + (t - 0.5) * (0.55 + rand() * 0.85));
    const y = H * (0.5 + (rand() - 0.5) * 0.42);
    const spread = 1 - Math.abs(x / W - 0.5) * 1.6;
    const radius = (26 + rand() * 92) * Math.max(0.25, spread);
    const alpha = (0.05 + rand() * 0.1) * Math.max(0.2, spread);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.45, `rgba(255,255,255,${alpha * 0.45})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Two things had to be cleaned off this before it stopped showing its own
  // outline on a dark panel.
  //
  // The blob scatter runs past every edge of the canvas, so the corner and
  // edge pixels were left holding an alpha of up to 10. That is nothing on a
  // lit page, but these are drawn additively onto near-black, where a straight
  // line of alpha 10 is a visible rectangle around the cloud.
  //
  // And the gradients are so shallow — a peak alpha near 100 spread over 500
  // pixels — that eight-bit steps land as contour lines through the middle of
  // the cloud. Chrome shows them plainly; Firefox dithers enough to hide them.
  // A few levels of noise breaks the plateaus apart so neither engine can draw
  // a line where the gradient has no edge.
  const img = ctx.getImageData(0, 0, W, H);
  const px = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4 + 3;
      const a = px[i];
      if (a === 0) continue;
      // ellipse in the canvas's own proportions, full strength until 0.75 of
      // the way out and squared so it leaves without an edge of its own
      const nx = (x / W - 0.5) * 2;
      const ny = (y / H - 0.5) * 2;
      const r = Math.sqrt(nx * nx + ny * ny);
      const fall = r <= 0.75 ? 1 : Math.max(0, 1 - (r - 0.75) / 0.25);
      px[i] = Math.max(0, Math.min(255, (a + (rand() - 0.5) * 5) * fall * fall));
    }
  }
  ctx.putImageData(img, 0, 0);

  return tuneTexture(new THREE.CanvasTexture(canvas));
}

export function makeStatLabelSprite(text, colorHex) {
  const fontSize = 30;
  const font = `600 ${fontSize}px 'JetBrains Mono', monospace`;
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = font;
  const textWidth = measure.measureText(text).width;

  const padX = 18;
  const { canvas, ctx, width, height } = hidpiCanvas(
    Math.ceil(textWidth + padX * 2),
    60
  );
  ctx.font = font;
  ctx.fillStyle = colorHex;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, padX, height / 2);

  const texture = tuneTexture(new THREE.CanvasTexture(canvas));
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const aspect = width / height;
  const scaleY = 0.4;
  sprite.scale.set(scaleY * aspect, scaleY, 1);
  return sprite;
}


export function makePlanetTexture(colorHex, seed) {
  const width = 256;
  const height = 128;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const base = new THREE.Color(colorHex);

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, width, height);

  // pseudo-random but stable per planet
  let s = seed * 9301 + 49297;
  function rand() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  }

  const bandCount = 5 + Math.floor(rand() * 5);
  for (let i = 0; i < bandCount; i++) {
    const y = rand() * height;
    const h = 4 + rand() * 16;
    const lighter = rand() > 0.5;
    const c = base.clone();
    c.offsetHSL(0, 0, lighter ? 0.1 + rand() * 0.1 : -(0.1 + rand() * 0.1));
    ctx.fillStyle = `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(
      c.b * 255
    )},${0.3 + rand() * 0.3})`;
    ctx.fillRect(0, y, width, h);
  }

  for (let i = 0; i < 260; i++) {
    const x = rand() * width;
    const y = rand() * height;
    ctx.fillStyle = `rgba(255,255,255,${rand() * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, rand() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  return tuneTexture(new THREE.CanvasTexture(canvas));
}


export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}


export function wrapCanvasText(ctx, text, cx, cy, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  words.forEach((w) => {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  const totalH = lines.length * lineHeight;
  const startY = cy - totalH / 2 + lineHeight / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, startY + i * lineHeight);
  });
}


// halo is opt-out because it is the one part of this badge made of large,
// soft, semi-transparent pixels — and browsers disagree about those. The same
// texture reads correctly in desktop Chrome and washed out in WebKit on a
// phone, where sixteen overlapping halos stack into a pale film over the cards.
// Desktop keeps it; narrow screens get a badge with no semi-transparent
// interior at all, so there is nothing left to disagree about.
export function makeCertBadgeTexture(name, colorHex, { halo = true } = {}) {
  // Taller than it was: a larger name wraps to three lines on the two diploma
  // titles, and at the old height the third line met the footer.
  const { canvas, ctx, width, height } = hidpiCanvas(512, 290);

  // soft glow halo behind the card
  if (halo) {
    ctx.save();
    try {
      ctx.filter = "blur(20px)";
    } catch (err) {
      /* canvas filter unsupported — skip the halo, card still renders fine */
    }
    roundRectPath(ctx, 26, 26, width - 52, height - 52, 26);
    ctx.fillStyle = colorHex;
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // card body
  const pad = 14;
  roundRectPath(ctx, pad, pad, width - pad * 2, height - pad * 2, 24);
  ctx.fillStyle = "rgb(8,11,22)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = colorHex;
  ctx.stroke();

  // achievement glyph (checkmark in a ring), centered near the top
  const cx = width / 2;
  const cy = 62;
  const r = 22;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = colorHex;
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = colorHex;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy);
  ctx.lineTo(cx - 2, cy + 8);
  ctx.lineTo(cx + 11, cy - 9);
  ctx.strokeStyle = "#eef1fb";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  // name
  ctx.fillStyle = "#eef1fb";
  ctx.font = "600 34px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  wrapCanvasText(ctx, name, cx, 162, width - 92, 40);

  // footer
  ctx.font = "500 21px 'JetBrains Mono', monospace";
  ctx.fillStyle = colorHex;
  ctx.fillText("SoftUni · view credential ↗", cx, height - 32);

  return tuneTexture(new THREE.CanvasTexture(canvas));
}

