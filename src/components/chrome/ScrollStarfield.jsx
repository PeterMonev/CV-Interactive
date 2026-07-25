import { useEffect, useRef } from "react";
import * as THREE from "three";
import { prefersReducedMotion } from "../../utils/motion.js";

function makeStarField(count, spread, depth, size, colorFn) {
  const baseX = new Float32Array(count);
  const baseY = new Float32Array(count);
  const z = new Float32Array(count);
  const positions = new Float32Array(count * 3);
  const colors = colorFn ? new Float32Array(count * 3) : null;

  for (let i = 0; i < count; i++) {
    baseX[i] = (Math.random() - 0.5) * spread;
    baseY[i] = (Math.random() - 0.5) * spread;
    z[i] = -Math.random() * depth;
    positions[i * 3] = baseX[i];
    positions[i * 3 + 1] = baseY[i];
    positions[i * 3 + 2] = z[i];
    if (colorFn) {
      const c = colorFn(i);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  if (colors) geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const matOpts = {
    size,
    transparent: true,
    sizeAttenuation: true,
    depthWrite: false,
  };
  if (colorFn) {
    matOpts.vertexColors = true;
    matOpts.blending = THREE.AdditiveBlending;
    matOpts.opacity = 0.85;
  } else {
    matOpts.color = 0xc4d4f5;
    matOpts.opacity = 0.75;
  }
  const mat = new THREE.PointsMaterial(matOpts);
  const points = new THREE.Points(geo, mat);
  const offX = new Float32Array(count);
  const offY = new Float32Array(count);

  return { points, geo, mat, baseX, baseY, z, offX, offY, positions };
}

// A field the camera sits still in front of — stars fly toward the viewer and
// wrap back to the far distance instead of a finite tunnel the camera moves
// through (which used to visibly run out near the bottom of the page).
// Speed reacts to scroll (bigger scroll = faster warp) and stars swerve away
// from the cursor as they pass close by, like the old 2D particle field did.


export function ScrollStarfield() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      68,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const depth = 46;
    const spread = 22;
    const starCount = window.innerWidth < 720 ? 220 : 420;
    const field = makeStarField(starCount, spread, depth, 0.045);
    scene.add(field.points);

    const palette = [
      new THREE.Color(0x00e5ff),
      new THREE.Color(0xff3ec9),
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0x5eead4),
    ];
    const accentCount = window.innerWidth < 720 ? 26 : 46;
    const accent = makeStarField(accentCount, spread * 0.85, depth, 0.11, (i) => palette[i % palette.length]);
    scene.add(accent.points);

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: 999, y: 999 };
    const finePointer =
      window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    function onMouseMove(e) {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    }
    if (finePointer) window.addEventListener("mousemove", onMouseMove);

    let lastScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    let scrollBoost = 0;
    function onScroll() {
      const top = window.scrollY || document.documentElement.scrollTop || 0;
      scrollBoost = Math.min(scrollBoost + Math.abs(top - lastScrollTop) * 0.006, 1.4);
      lastScrollTop = top;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    let visible = !document.hidden;
    function onVisibility() {
      visible = !document.hidden;
    }
    document.addEventListener("visibilitychange", onVisibility);

    function stepField(f, mx, my) {
      const speed = 0.01 + scrollBoost * 0.045;
      for (let i = 0; i < f.z.length; i++) {
        let zi = f.z[i] + speed;
        if (zi > camera.position.z) {
          zi = camera.position.z - depth;
          f.baseX[i] = (Math.random() - 0.5) * spread;
          f.baseY[i] = (Math.random() - 0.5) * spread;
          f.offX[i] = 0;
          f.offY[i] = 0;
        }
        f.z[i] = zi;

        const distToCam = camera.position.z - zi;
        const closeness = Math.max(0, 1 - distToCam / 9);

        let targetX = 0;
        let targetY = 0;
        if (closeness > 0) {
          const dx = f.baseX[i] - mx;
          const dy = f.baseY[i] - my;
          const dist = Math.hypot(dx, dy) || 0.0001;
          if (dist < 2.4) {
            const push = (2.4 - dist) * 0.55 * closeness;
            targetX = (dx / dist) * push;
            targetY = (dy / dist) * push;
          }
        }

        // ease toward the target displacement instead of snapping straight to
        // it — this is what makes stars drift away slowly rather than jump
        f.offX[i] += (targetX - f.offX[i]) * 0.03;
        f.offY[i] += (targetY - f.offY[i]) * 0.03;

        f.positions[i * 3] = f.baseX[i] + f.offX[i];
        f.positions[i * 3 + 1] = f.baseY[i] + f.offY[i];
        f.positions[i * 3 + 2] = zi;
      }
      f.geo.attributes.position.needsUpdate = true;
    }

    let raf = null;
    function animate() {
      if (visible && !reduced) {
        scrollBoost *= 0.93;
        const mx = mouse.x * 6;
        const my = mouse.y * 4;
        stepField(field, mx, my);
        stepField(accent, mx, my);
        const t = performance.now() * 0.001;
        accent.mat.opacity = 0.65 + Math.sin(t * 1.4) * 0.2;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      if (finePointer) window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
      field.geo.dispose();
      field.mat.dispose();
      accent.geo.dispose();
      accent.mat.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="scroll-starfield" aria-hidden="true" />;
}

