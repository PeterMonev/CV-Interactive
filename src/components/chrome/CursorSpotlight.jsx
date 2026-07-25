import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../utils/motion.js";

export function CursorSpotlight() {
  const ref = useRef(null);
  useEffect(() => {
    const fine =
      window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || prefersReducedMotion()) return;
    const el = ref.current;
    const handle = (e) => {
      if (!el) return;
      el.style.transform = `translate(${e.clientX - 220}px, ${e.clientY - 220}px)`;
      el.style.opacity = "1";
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);
  return <div ref={ref} className="cursor-spotlight" aria-hidden="true" />;
}

