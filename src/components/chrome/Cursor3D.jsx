import { useEffect, useRef } from "react";
import * as THREE from "three";
import { tuneRenderer, guardContext, createRenderer, retryScene } from "../../utils/gfx.js";
import { useSceneGeneration } from "../../hooks/useSceneGeneration.js";
import { prefersReducedMotion } from "../../utils/motion.js";

export function Cursor3D() {
  const wrapRef = useRef(null);
  const mountRef = useRef(null);

  const [generation, rebuildScene] = useSceneGeneration();

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const wrap = wrapRef.current;
    const container = mountRef.current;
    if (!wrap || !container) return undefined;

    const size = 46;
    let renderer;
    let scene;
    let camera;
    let geo;
    let edges;
    let mat;
    let shape;

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
      camera.position.z = 3;

      renderer = createRenderer({ antialias: true, alpha: true });
      if (!renderer) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(size, size);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);
    const unguardContext = guardContext(renderer, rebuildScene, { attempt: generation });

      geo = new THREE.OctahedronGeometry(0.85, 0);
      edges = new THREE.EdgesGeometry(geo);
      mat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.9 });
      shape = new THREE.LineSegments(edges, mat);
      scene.add(shape);
    } catch (err) {
      // WebGL context unavailable — bail out without touching the native
      // cursor's CSS class, so the OS pointer stays visible as a fallback.
      return undefined;
    }

    // Native cursor is hidden ONLY via this class, toggled here — never by a
    // blanket always-on CSS rule. That keeps the two in sync: if the 3D
    // cursor fails above, we return early and never reach this line, so the
    // native cursor is guaranteed to still be visible instead of neither
    // cursor showing at all.
    document.body.classList.add("cursor3d-active");

    function handleMove(e) {
      wrap.style.transform = `translate(${e.clientX - size / 2}px, ${e.clientY - size / 2}px)`;
      wrap.style.opacity = "1";
    }
    function handleDown() {
      shape.scale.set(0.75, 0.75, 0.75);
    }
    function handleUp() {
      shape.scale.set(1, 1, 1);
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);

    let raf = null;
    function animate() {
      shape.rotation.x += 0.018;
      shape.rotation.y += 0.024;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      unguardContext();
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      document.body.classList.remove("cursor3d-active");
      geo.dispose();
      edges.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [generation]);

  return (
    <div ref={wrapRef} className="cursor-3d-wrap" aria-hidden="true">
      <div ref={mountRef} />
    </div>
  );
}
