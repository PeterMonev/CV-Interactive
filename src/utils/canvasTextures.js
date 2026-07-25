import * as THREE from "three";

export function makeLabelSprite(text, colorHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 76;
  const ctx = canvas.getContext("2d");
  ctx.font = "600 38px 'JetBrains Mono', monospace";
  ctx.fillStyle = colorHex;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
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
  return new THREE.CanvasTexture(c);
}


export function makeStatLabelSprite(text, colorHex) {
  const fontSize = 30;
  const font = `600 ${fontSize}px 'JetBrains Mono', monospace`;
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = font;
  const textWidth = measure.measureText(text).width;

  const padX = 18;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(textWidth + padX * 2);
  canvas.height = 60;
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  ctx.fillStyle = colorHex;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, padX, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const aspect = canvas.width / canvas.height;
  const scaleY = 0.4;
  sprite.scale.set(scaleY * aspect, scaleY, 1);
  return sprite;
}


export function makePlanetTexture(colorHex, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const base = new THREE.Color(colorHex);

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // pseudo-random but stable per planet
  let s = seed * 9301 + 49297;
  function rand() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  }

  const bandCount = 5 + Math.floor(rand() * 5);
  for (let i = 0; i < bandCount; i++) {
    const y = rand() * canvas.height;
    const h = 4 + rand() * 16;
    const lighter = rand() > 0.5;
    const c = base.clone();
    c.offsetHSL(0, 0, lighter ? 0.1 + rand() * 0.1 : -(0.1 + rand() * 0.1));
    ctx.fillStyle = `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(
      c.b * 255
    )},${0.3 + rand() * 0.3})`;
    ctx.fillRect(0, y, canvas.width, h);
  }

  for (let i = 0; i < 260; i++) {
    const x = rand() * canvas.width;
    const y = rand() * canvas.height;
    ctx.fillStyle = `rgba(255,255,255,${rand() * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, rand() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
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
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 260;
  const ctx = canvas.getContext("2d");

  // soft glow halo behind the card
  ctx.save();
  try {
    ctx.filter = "blur(20px)";
  } catch (err) {
    /* canvas filter unsupported — skip the halo, card still renders fine */
  }
  roundRectPath(ctx, 26, 26, canvas.width - 52, canvas.height - 52, 26);
  ctx.fillStyle = colorHex;
  ctx.globalAlpha = 0.4;
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;

  // card body
  const pad = 14;
  roundRectPath(ctx, pad, pad, canvas.width - pad * 2, canvas.height - pad * 2, 24);
  ctx.fillStyle = "rgba(8,11,22,0.95)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = colorHex;
  ctx.stroke();

  // achievement glyph (checkmark in a ring), centered near the top
  const cx = canvas.width / 2;
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
  wrapCanvasText(ctx, name, cx, 150, canvas.width - 96, 36);

  // footer
  ctx.font = "500 19px 'JetBrains Mono', monospace";
  ctx.fillStyle = colorHex;
  ctx.fillText("SoftUni · view credential ↗", cx, canvas.height - 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

