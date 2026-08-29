// The colour the cursor takes from whatever part of the page it is over.
//
// Nine sections already declare a --section-accent, and it drives the eyebrow
// pills, the borders, the progress bar and the navigation. The cursor was cyan
// everywhere and knew none of it. Reading the same variable costs nothing and
// makes the pointer part of the same design rather than a thing floating over
// it.
//
// One module because two separate pieces need the same answer — the 3D shape
// and the light trail behind it — and two copies would drift the moment either
// was adjusted. The spotlight owns the stepping, since it mounts whenever there
// is a pointer at all; the shape only reads.

const FALLBACK = [0, 229, 255];

const current = [...FALLBACK];
let target = [...FALLBACK];

// Section accents never change at runtime, so each one is parsed once. Without
// this, every mousemove would ask for a computed style and force a style
// recalculation for a value that was the same as last time.
const cache = new Map();

function parseAccent(raw) {
  const hex = String(raw || "").trim();
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Point the colour at whatever section the element belongs to. Anything outside
// a section — the navigation, the footer — keeps the default.
export function aimAt(el) {
  const section = el && el.closest ? el.closest("section[id]") : null;
  const key = section ? section.id : "";
  if (!cache.has(key)) {
    const raw = section
      ? getComputedStyle(section).getPropertyValue("--section-accent")
      : "";
    cache.set(key, parseAccent(raw) || FALLBACK);
  }
  target = cache.get(key);
}

// Walk the colour towards the target and publish it. Eased rather than set:
// crossing a section boundary should be a change of light, not a switch being
// thrown.
export function stepAccent(k = 0.06) {
  let moving = false;
  for (let i = 0; i < 3; i++) {
    const d = target[i] - current[i];
    if (Math.abs(d) > 0.5) moving = true;
    current[i] += d * k;
  }
  if (moving && typeof document !== "undefined") {
    document.documentElement.style.setProperty(
      "--cursor-accent-rgb",
      `${Math.round(current[0])}, ${Math.round(current[1])}, ${Math.round(current[2])}`
    );
  }
  return current;
}

export function currentAccent() {
  return current;
}
