import { useEffect, useRef } from "react";
import * as THREE from "three";
import { tuneRenderer } from "../../utils/gfx.js";
import { prefersReducedMotion } from "../../utils/motion.js";
import { makeGlowSpriteTexture, makeStatLabelSprite } from "../../utils/canvasTextures.js";

export function StatsField3D({ stats }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 20);
    camera.position.set(0, 0, 6.4);
    camera.lookAt(0, 0, 0);

    const renderer = tuneRenderer(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const icoGeo = new THREE.IcosahedronGeometry(1.5, 1);
    const icoEdges = new THREE.EdgesGeometry(icoGeo);
    const icoMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.55,
    });
    const wireframe = new THREE.LineSegments(icoEdges, icoMat);
    group.add(wireframe);

    const coreGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowSpriteTexture(),
        color: 0x00e5ff,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.5,
      })
    );
    coreGlow.scale.set(3.2, 3.2, 1);
    group.add(coreGlow);

    const markers = [];
    stats.forEach((s) => {
      const dot = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeGlowSpriteTexture(),
          color: new THREE.Color(s.color),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      dot.position.set(s.x, s.y, s.z);
      dot.scale.set(0.5, 0.5, 1);
      group.add(dot);

      const label = makeStatLabelSprite(`${s.value} ${s.label}`, s.color);
      label.position.set(s.x + 0.32, s.y + 0.05, s.z);
      group.add(label);

      markers.push({ dot, phase: Math.random() * Math.PI * 2 });
    });

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resize();
    window.addEventListener("resize", resize);
    // ResizeObserver catches container size changes that don't fire a
    // window resize event (CSS layout settling, sidebar/content reflow,
    // initial mount before paint) — window resize alone can leave the
    // canvas mis-sized until the user happens to resize the browser.
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (ro && container) ro.observe(container);

    let pointerDown = false;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;

    function onPointerDown(e) {
      pointerDown = true;
      dragging = false;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      try {
        container.setPointerCapture(e.pointerId);
      } catch (err) {
        /* noop */
      }
    }
    function onPointerMove(e) {
      if (!pointerDown) return;
      const totalDx = e.clientX - startX;
      const totalDy = e.clientY - startY;
      if (!dragging && Math.hypot(totalDx, totalDy) > 4) {
        dragging = true;
        container.style.cursor = "grabbing";
      }
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        group.rotation.y += dx * 0.007;
        group.rotation.x += dy * 0.007;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    }
    function onPointerUp(e) {
      pointerDown = false;
      dragging = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch (err) {
        /* noop */
      }
      container.style.cursor = "grab";
    }

    container.style.cursor = "grab";
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);

    let raf = null;
    let running = true;

    function animate() {
      if (!running) {
        raf = null;
        return;
      }
      if (!reduced) {
        const t = performance.now() * 0.001;
        wireframe.rotation.y += 0.0022;
        wireframe.rotation.x += 0.0008;
        if (!dragging) {
          group.rotation.y += 0.0009;
        }
        coreGlow.material.opacity = 0.4 + Math.sin(t * 1.6) * 0.12;
        markers.forEach(({ dot, phase }) => {
          const pulse = 1 + Math.sin(t * 2.4 + phase) * 0.25;
          dot.scale.set(0.5 * pulse, 0.5 * pulse, 1);
        });
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }

    let io = null;
    if (reduced) {
      renderer.render(scene, camera);
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
      io.observe(container);
      animate();
    }

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect();
      window.removeEventListener("resize", resize);
      if (ro) ro.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [stats]);

  return <div ref={mountRef} className="stats-3d" aria-hidden="true" />;
}
