import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../utils/motion.js";
import { aimAt, stepAccent } from "../../utils/cursorAccent.js";

// A trail of light dragged along behind the pointer.
//
// This was a chain of lights each easing towards the one in front, which has
// two faults that get worse the longer you make it. A light easing towards a
// moving target cuts the corner instead of going round it, so a curved sweep
// came out as a straight smear. And length and settling time are the same
// number there: the only way to stretch the tail was to slow every link down,
// which left it hanging around for seconds after the pointer had stopped.
//
// So it remembers instead. Every frame the pointer's position goes into a ring
// buffer, and each light is placed at a fixed number of frames into the past.
// The tail is then the path the pointer actually took, curves and all, and it
// retracts in exactly as many frames as it is deep however long it looks.

const TRAIL = 14;
// frames between one light and the next. This is the whole length control:
// the tail reaches back TRAIL * STEP frames, which at an ordinary sweep of the
// hand is most of a screen width, and takes the same span to gather back up.
const STEP = 7;
const DEPTH = TRAIL * STEP;

const HEAD = 420;
const TAPER = 23; // px smaller per light

const sizes = Array.from({ length: TRAIL }, (_, i) => HEAD - i * TAPER);
const fade = Array.from({ length: TRAIL }, (_, i) => 1 - i / TRAIL);

export function CursorSpotlight() {
  const refs = useRef([]);

  useEffect(() => {
    const fine =
      window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || prefersReducedMotion()) return undefined;

    const nodes = refs.current.filter(Boolean);
    if (nodes.length !== TRAIL) return undefined;

    const hist = new Float32Array(DEPTH * 2);
    let head = 0;
    let pointerX = 0;
    let pointerY = 0;
    let placed = false;
    let raf = null;

    const handle = (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      aimAt(e.target instanceof Element ? e.target : null);
      // the first move fills the whole history with one point, so the tail
      // grows out of the pointer rather than whipping in from the corner
      if (!placed) {
        for (let i = 0; i < DEPTH; i++) {
          hist[i * 2] = pointerX;
          hist[i * 2 + 1] = pointerY;
        }
        nodes.forEach((n, i) => {
          n.style.opacity = String(fade[i]);
        });
        placed = true;
      }
    };

    const tick = () => {
      stepAccent();
      head = (head + 1) % DEPTH;
      hist[head * 2] = pointerX;
      hist[head * 2 + 1] = pointerY;

      for (let i = 0; i < TRAIL; i++) {
        // i * STEP is always below DEPTH, so one wrap is enough to stay positive
        const at = (head - i * STEP + DEPTH) % DEPTH;
        const r = sizes[i] / 2;
        nodes[i].style.transform =
          `translate(${hist[at * 2] - r}px, ${hist[at * 2 + 1] - r}px)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handle);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handle);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Deliberately siblings and not wrapped in a div: an ancestor with an opacity
  // below 1 would group them, and mix-blend-mode would then blend inside that
  // group instead of against the page behind it.
  return (
    <>
      {sizes.map((size, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="cursor-spotlight"
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
