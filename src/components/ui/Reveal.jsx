import { useReveal } from "../../hooks/useReveal.js";

export function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal(0.12);
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-in" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

