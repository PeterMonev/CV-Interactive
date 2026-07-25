import { useState, useEffect, useRef } from "react";
import { Terminal } from "lucide-react";

export function BootLoader({ onDone }) {
  const [pct, setPct] = useState(0);
  const [hide, setHide] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const duration = 1000;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setPct(Math.round(p * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setHide(true);
          setTimeout(() => onDoneRef.current && onDoneRef.current(), 450);
        }, 200);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`boot ${hide ? "boot-hide" : ""}`}>
      <div className="boot-inner">
        <Terminal size={22} />
        <p className="boot-line">booting peter-monev.dev</p>
        <div className="boot-bar">
          <div className="boot-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="boot-pct">{pct}%</p>
      </div>
    </div>
  );
}

