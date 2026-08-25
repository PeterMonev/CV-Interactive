import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { tuneRenderer, guardContext, createRenderer, retryScene } from "../../utils/gfx.js";
import { useSceneGeneration } from "../../hooks/useSceneGeneration.js";
import { ArrowUp } from "lucide-react";
import { prefersReducedMotion, magneticMove, magneticLeave } from "../../utils/motion.js";

function ScrollTop3D({ onFail }) {
  const mountRef = useRef(null);

  const [generation, rebuildScene] = useSceneGeneration();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;
    const reduced = prefersReducedMotion();

    let renderer;
    let scene;
    let camera;
    let geo;
    let edges;
    let mat;
    let shape;
    // declared out here on purpose: the cleanup below is outside the try, and a
    // const inside it would not exist by the time unmounting calls it
    let unguardContext = null;

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
      camera.position.z = 3;

      renderer = createRenderer({ antialias: true, alpha: true });
      if (!renderer) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(42, 42);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);
      unguardContext = guardContext(renderer, rebuildScene, { attempt: generation });

      // dodecahedron — more visually interesting than a plain arrow shape,
      // cyan so it reads clearly now that the button has no filled background
      geo = new THREE.TorusGeometry(0.78, 0.32, 6, 12);
      edges = new THREE.EdgesGeometry(geo);
      mat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.95,
      });
      shape = new THREE.LineSegments(edges, mat);
      scene.add(shape);
    } catch (err) {
      if (onFail) onFail();
      return undefined;
    }

    let raf = null;
    function animate() {
      if (!reduced) {
        shape.rotation.y += 0.006;
        shape.rotation.x = Math.sin(performance.now() * 0.0004) * 0.1;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      if (unguardContext) unguardContext();
      cancelAnimationFrame(raf);
      geo.dispose();
      edges.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation]);

  return <div ref={mountRef} className="scroll-top-3d" aria-hidden="true" />;
}

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    // Watching the hero section's visibility (rather than doing manual
    // window.scrollY math) works regardless of which element actually
    // scrolls — window/document, or an inner wrapper some sandboxes use —
    // since IntersectionObserver tracks visibility against the real
    // viewport either way.
    const hero = document.getElementById("home");
    if (!hero) {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setVisible(!entry.isIntersecting));
      },
      { threshold: 0, rootMargin: "-80% 0px 0px 0px" }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  const handleFail = useCallback(() => setWebglFailed(true), []);

  function handleClick() {
    const hero = document.getElementById("home");
    if (hero) {
      hero.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <button
      type="button"
      className={`scroll-top-btn ${visible ? "scroll-top-visible" : ""}`}
      onClick={handleClick}
      aria-label="Scroll back to top"
      tabIndex={visible ? 0 : -1}
      onMouseMove={magneticMove}
      onMouseLeave={magneticLeave}
    >
      {webglFailed ? <ArrowUp size={20} /> : <ScrollTop3D onFail={handleFail} />}
    </button>
  );
}
