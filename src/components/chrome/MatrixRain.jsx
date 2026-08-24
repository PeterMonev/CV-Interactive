import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../utils/motion.js";

export function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduced = prefersReducedMotion();

    const glyphs =
      "01アイウエオカキクケコサシスセソ{}<>/*+=;:PMFCJS#";
    const fontSize = 15;
    // Fall speed in rows per frame. TRAIL_FADE is the per-frame alpha of the
    // backdrop wipe, so it must move with FALL_SPEED: a glyph stays visible for
    // a fixed number of *frames*, and the trail length is however far the head
    // travels in that time. Halve the speed alone and the trails halve too —
    // keep the ratio roughly constant to change pace without changing the look.
    const FALL_SPEED = 0.12;
    const TRAIL_FADE = 0.055;
    let columns = 0;
    let drops = [];

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      columns = Math.max(1, Math.floor(canvas.width / fontSize));
      drops = Array.from({ length: columns }, () => Math.random() * -60);
    }
    resize();
    window.addEventListener("resize", resize);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);

    function draw() {
      ctx.fillStyle = `rgba(6,8,16,${TRAIL_FADE})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
      for (let i = 0; i < columns; i++) {
        const char = glyphs[Math.floor(Math.random() * glyphs.length)];
        const isHead = Math.random() > 0.975;
        ctx.fillStyle = isHead ? "rgba(238,241,251,0.85)" : "rgba(0,229,255,0.4)";
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += FALL_SPEED;
      }
    }

    let visible = !document.hidden;
    function onVisibility() {
      visible = !document.hidden;
    }
    document.addEventListener("visibilitychange", onVisibility);

    let raf = null;
    let running = true;

    function animate() {
      if (!running) {
        raf = null;
        return;
      }
      if (visible && !reduced) draw();
      raf = requestAnimationFrame(animate);
    }

    let io = null;
    if (reduced) {
      draw();
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const was = running;
            running = entry.isIntersecting;
            if (running && !was) animate();
          });
        },
        { threshold: 0.05 }
      );
      io.observe(canvas);
      animate();
    }

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect();
      window.removeEventListener("resize", resize);
      if (ro) ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-rain" aria-hidden="true" />;
}

