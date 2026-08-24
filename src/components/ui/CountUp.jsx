import { useState, useEffect, useRef } from "react";
import { useReveal } from "../../hooks/useReveal.js";
import { prefersReducedMotion } from "../../utils/motion.js";

// The figure is driven by scroll position rather than by a timer of its own.
//
// A timed count fires once and is over before you have finished arriving; tying
// it to the scroll means the number is still being earned while you are reading
// the label next to it, and scrolling back winds it down again. The range is
// deliberately short — full value by the time the row sits comfortably in view —
// so nobody who stops half way is left looking at a wrong number.
//
// GSAP is imported on demand: a counter is not worth putting an animation
// library in front of the first paint. Until it lands, and for anyone who asked
// for reduced motion, the original timed count runs instead.
export function CountUp({ to, duration = 1200 }) {
  const [revealRef, visible] = useReveal(0.4);
  const [val, setVal] = useState(0);
  const elRef = useRef(null);
  const scrubbedRef = useRef(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el || prefersReducedMotion()) return undefined;

    let tween = null;
    let cancelled = false;

    import("../../utils/scrollFx.js").then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !elRef.current) return;
      scrubbedRef.current = true;
      const state = { n: 0 };
      tween = gsap.to(state, {
        n: to,
        ease: "none",
        onUpdate: () => setVal(Math.round(state.n)),
        scrollTrigger: {
          trigger: elRef.current,
          start: "top 92%",
          end: "top 62%",
          scrub: 0.4,
        },
      });
    });

    return () => {
      cancelled = true;
      if (tween) {
        if (tween.scrollTrigger) tween.scrollTrigger.kill();
        tween.kill();
      }
    };
  }, [to]);

  // Fallback for reduced motion, and for the moment before GSAP arrives.
  useEffect(() => {
    if (!visible || scrubbedRef.current) return undefined;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      if (scrubbedRef.current) return;
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round(p * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, to, duration]);

  return (
    <span
      ref={(node) => {
        elRef.current = node;
        revealRef.current = node;
      }}
    >
      {val}
    </span>
  );
}
