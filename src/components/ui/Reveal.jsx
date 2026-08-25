import { useReveal } from "../../hooks/useReveal.js";

// One entrance used fifty-seven times reads as a template however good the
// sections are. The variant picks the motion that suits what is arriving:
// headings get wiped in, media scales up into place, and everything else keeps
// the original rise. All three are CSS transitions on transform, opacity and
// clip-path, so none of them can move the layout or cost a library.
export function Reveal({ children, delay = 0, className = "", variant = "rise" }) {
  const [ref, visible] = useReveal(0.12);
  return (
    <div
      ref={ref}
      className={`reveal reveal-${variant} ${visible ? "reveal-in" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
