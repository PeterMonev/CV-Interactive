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


export function makeCertBadgeTexture(name, colorHex) {
  const { canvas, ctx, width, height } = hidpiCanvas(512, 260);

  // soft glow halo behind the card
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

  // card body
  const pad = 14;
  roundRectPath(ctx, pad, pad, width - pad * 2, height - pad * 2, 24);
  ctx.fillStyle = "rgba(8,11,22,0.95)";
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
  ctx.font = "600 30px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  wrapCanvasText(ctx, name, cx, 150, width - 96, 36);

  // footer
  ctx.font = "500 19px 'JetBrains Mono', monospace";
  ctx.fillStyle = colorHex;
  ctx.fillText("SoftUni · view credential ↗", cx, height - 30);

  return tuneTexture(new THREE.CanvasTexture(canvas));
}

