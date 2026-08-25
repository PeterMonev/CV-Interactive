import { useState, useEffect, useRef } from "react";

// Reveals content once it has been scrolled to.
//
// Everything wrapped in this starts at opacity 0, so the reveal firing is not
// decoration — it is the only thing standing between the reader and a blank
// section. That makes a single point of failure unacceptable: an observer whose
// callbacks are never delivered leaves the text permanently invisible, with no
// error anywhere to explain it.
//
// So two independent triggers. IntersectionObserver is the efficient one. A
// rect read — once on mount, then on scroll and resize — is the one that still
// works when observer callbacks are not arriving. Whichever fires first wins
// and the other is detached.
export function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let settled = false;
    let observer = null;

    const settle = () => {
      if (settled) return;
      settled = true;
      setVisible(true);
      if (observer) observer.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };

    function check() {
      const node = ref.current;
      if (settled || !node) return;
      const rect = node.getBoundingClientRect();
      const height = window.innerHeight || 0;
      // Matches the observer: enough of the element is on screen, or it is
      // taller than the viewport and therefore covers it.
      const shown = Math.min(rect.bottom, height) - Math.max(rect.top, 0);
      if (shown <= 0) return;
      if (shown >= rect.height * threshold || shown >= height) settle();
    }

    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) settle();
        },
        { threshold }
      );
      observer.observe(el);
    }

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [threshold]);

  return [ref, visible];
}
