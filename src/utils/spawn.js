// The entrance a scene plays when the reader reaches it.
//
// Scenes are built about a viewport before they are seen, so an entrance timed
// from construction would finish before anyone arrived. This is timed from the
// moment the scene actually appears, with a fallback in case that signal never
// comes — a scene stuck at scale zero is far worse than one that starts early.
//
// Shared because three scenes want the same curve, and three copies of it would
// stop matching the first time one was adjusted.

const DEFAULTS = {
  // long enough to follow, short enough not to feel like waiting
  duration: 1500,
  // the gap between items: this is what lets the eye track them one by one
  stagger: 260,
  fallbackMs: 2500,
  // renders the finished state at once, for reduced motion
  skip: false,
};

export function createSpawn(options = {}) {
  const { duration, stagger, fallbackMs, skip } = { ...DEFAULTS, ...options };
  let start = null;

  const begin = () => {
    if (start === null) start = performance.now();
  };
  const fallback = skip ? null : setTimeout(begin, fallbackMs);

  return {
    begin,
    started() {
      return start !== null;
    },
    // Progress for item i, eased, overshooting slightly before settling so each
    // piece lands rather than stops.
    at(i = 0) {
      if (skip) return 1;
      if (start === null) return 0;
      const p = Math.min(
        1,
        Math.max(0, (performance.now() - start - i * stagger) / duration)
      );
      if (p >= 1) return 1;
      return 1 - Math.pow(1 - p, 3) + Math.sin(p * Math.PI) * 0.06;
    },
    // Plain 0..1 with no overshoot, for things that must not exceed their value
    // — opacity, and anything else that would clip or wrap past 1.
    linear(i = 0) {
      if (skip) return 1;
      if (start === null) return 0;
      return Math.min(
        1,
        Math.max(0, (performance.now() - start - i * stagger) / duration)
      );
    },
    dispose() {
      if (fallback) clearTimeout(fallback);
    },
  };
}
