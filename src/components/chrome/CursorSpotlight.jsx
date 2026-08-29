import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../utils/motion.js";

// A pool of light that follows the pointer around the page.
//
// It used to be written straight to the element on every mousemove, which put
// it exactly under the pointer at all times — and something pinned exactly to
// the mouse reads as a decal stuck to the screen, not as light. Light has to
// arrive. So the position is chased on an animation frame instead, catching up
// by a fraction of the remaining distance each time, which leaves it trailing
// behind fast movement and settling a moment after the pointer stops.
export function CursorSpotlight() {
  const ref = useRef(null);

  useEffect(() => {
    const fine =
      window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || prefersReducedMotion()) return undefined;

    const el = ref.current;
    if (!el) return undefined;

    const RADIUS = 220;
    // per frame, so the light lands roughly a fifth of a second after the
    // pointer: far enough behind to be seen doing it, not so far that it feels
    // detached from the hand moving it
    const EASE = 0.075;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let placed = false;
    let raf = null;

    const handle = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      // the first move puts it under the pointer rather than letting it fly in
      // from the top left corner of the page
      if (!placed) {
        x = targetX;
        y = targetY;
        placed = true;
        el.style.opacity = "1";
      }
    };

    const tick = () => {
      x += (targetX - x) * EASE;
      y += (targetY - y) * EASE;
      el.style.transform = `translate(${x - RADIUS}px, ${y - RADIUS}px)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handle);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handle);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="cursor-spotlight" aria-hidden="true" />;
}
