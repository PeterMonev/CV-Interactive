import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../utils/motion.js";

// A trail of light dragged along behind the pointer.
//
// One lagging circle only ever reads as a circle that is late. What makes a
// streak is a chain: the first light chases the pointer, and every one after it
// chases the light in front, so each is a little further behind than the last.
// Standing still they stack into a single pool; moving, they pull apart into a
// tapering line pointing back the way the hand came.
//
// Each is dimmer and smaller than the one ahead of it, and the gradient itself
// is faint precisely because seven of them add up — the brightness you see is
// the stack, not any one circle.

const TRAIL = 7;
// per frame, per link. Larger snaps the chain tight; smaller lets it string
// out further behind and take longer to gather back up.
const EASE = 0.25;

const HEAD = 440;
const TAPER = 40; // px smaller per link

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

    const pts = Array.from({ length: TRAIL }, () => ({ x: 0, y: 0 }));
    let pointerX = 0;
    let pointerY = 0;
    let placed = false;
    let raf = null;

    const handle = (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      // the first move drops the whole chain on the pointer, rather than
      // letting it whip in from the corner of the page
      if (!placed) {
        pts.forEach((p) => {
          p.x = pointerX;
          p.y = pointerY;
        });
        nodes.forEach((n, i) => {
          n.style.opacity = String(fade[i]);
        });
        placed = true;
      }
    };

    const tick = () => {
      let leadX = pointerX;
      let leadY = pointerY;
      for (let i = 0; i < TRAIL; i++) {
        const p = pts[i];
        p.x += (leadX - p.x) * EASE;
        p.y += (leadY - p.y) * EASE;
        const r = sizes[i] / 2;
        nodes[i].style.transform = `translate(${p.x - r}px, ${p.y - r}px)`;
        // the next link aims at where this one just landed, not at the pointer
        leadX = p.x;
        leadY = p.y;
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
