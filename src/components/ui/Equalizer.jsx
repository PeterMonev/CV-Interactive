import { useMemo } from "react";

export function Equalizer({ bars = 32, className = "" }) {
  const heights = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const wave = Math.abs(
          Math.sin(i * 0.45) * 0.7 + Math.cos(i * 0.19) * 0.3
        );
        return 18 + wave * 60;
      }),
    [bars]
  );
  return (
    <div className={`eq ${className}`} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className="eq-bar"
          style={{ height: `${h}%`, animationDelay: `${(i % 12) * 0.09}s` }}
        >
          <span className="eq-bar-top" />
        </span>
      ))}
    </div>
  );
}

