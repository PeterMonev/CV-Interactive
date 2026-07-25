import { useState, useEffect, useRef } from "react";
import { useReveal } from "../../hooks/useReveal.js";
import { prefersReducedMotion } from "../../utils/motion.js";
import { SCRAMBLE_CHARS } from "../../data/misc.js";

export function ScrambleHeading({ text, className = "" }) {
  const [ref, visible] = useReveal(0.4);
  const [display, setDisplay] = useState(text);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!visible || startedRef.current) return;
    startedRef.current = true;
    if (prefersReducedMotion()) {
      setDisplay(text);
      return;
    }
    let frame = 0;
    const totalFrames = 16;
    const id = setInterval(() => {
      frame += 1;
      const revealCount = Math.floor((frame / totalFrames) * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        if (i < revealCount || text[i] === " ") {
          out += text[i];
        } else {
          out += SCRAMBLE_CHARS[
            Math.floor(Math.random() * SCRAMBLE_CHARS.length)
          ];
        }
      }
      setDisplay(out);
      if (frame >= totalFrames) {
        setDisplay(text);
        clearInterval(id);
      }
    }, 32);
    return () => clearInterval(id);
  }, [visible, text]);

  return (
    <h2 ref={ref} className={className}>
      {display}
    </h2>
  );
}

