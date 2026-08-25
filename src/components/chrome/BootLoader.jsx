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
    let finished = false;
    const start = performance.now();
    const duration = 1000;

    const finish = () => {
      if (finished) return;
      finished = true;
      setPct(100);
      setHide(true);
      setTimeout(() => onDoneRef.current && onDoneRef.current(), 450);
    };

    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setPct(Math.round(p * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(finish, 200);
      }
    };
    raf = requestAnimationFrame(tick);

    // The page is scroll-locked until this finishes, and everything above runs
    // on animation frames. A tab opened in the background gets none of them, so
    // without this the visitor arrives at a splash screen that cannot be
    // scrolled past. The normal path takes 1650ms; this only ever fires when
    // the frames never came.
    const failsafe = setTimeout(finish, 2600);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
    };
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

