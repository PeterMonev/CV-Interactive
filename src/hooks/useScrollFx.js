import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../utils/motion.js";

// Attaches a scroll-linked drift to an element.
//
// GSAP is pulled in dynamically rather than imported at the top. Nothing here
// matters until the visitor scrolls, and importing it statically put 47 KB
// gzipped of animation library in front of the first paint — undoing the work
// that got the blocking bundle down in the first place. It arrives a moment
// later, in parallel, and the page is interactive before it does.
//
// Deliberately never applied to the same node as a <Reveal>: that component owns
// its wrapper's transform through a CSS transition, and two things writing the
// same property fight. These hooks target a child instead, so the two compose —
// the wrapper handles arrival, this handles the whole journey across the screen.
export function useParallax(options) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    let tween = null;
    let cancelled = false;
    let refreshId = null;

    import("../utils/scrollFx.js").then(({ parallax, refreshScrollFx }) => {
      if (cancelled || !ref.current) return;
      tween = parallax(ref.current, options);
      // A lazily mounted 3D scene changes the page height after the triggers
      // were measured, which leaves everything below anchored to the wrong spot.
      refreshId = setTimeout(refreshScrollFx, 400);
    });

    return () => {
      cancelled = true;
      if (refreshId) clearTimeout(refreshId);
      if (tween) {
        if (tween.scrollTrigger) tween.scrollTrigger.kill();
        tween.kill();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
