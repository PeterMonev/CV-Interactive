import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createBloomComposer } from "../../utils/bloom.js";
import { tuneRenderer } from "../../utils/gfx.js";
import { prefersReducedMotion } from "../../utils/motion.js";

export function Hero3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();
    const finePointer =
      window.matchMedia && window.matchMedia("(pointer: fine)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 11;

    const renderer = tuneRenderer(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const icoGeo = new THREE.IcosahedronGeometry(1.9, 1);
    const icoEdges = new THREE.EdgesGeometry(icoGeo);
    const icoMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.55,
    });
    const wireframe = new THREE.LineSegments(icoEdges, icoMat);
    scene.add(wireframe);

    const knotGeo = new THREE.TorusKnotGeometry(0.95, 0.26, 128, 14);
    const knotEdges = new THREE.EdgesGeometry(knotGeo, 1);
    const knotMat = new THREE.LineBasicMaterial({
      color: 0xff3ec9,
      transparent: true,
      opacity: 0.5,
    });
    // Both shapes sit concentric at the origin. They're wireframes (line
    // segments only, no filled faces), so overlapping lines just read as a
    // denser interlocking pattern — there's no hidden-surface/occlusion
    // issue like there would be with solid meshes, so this doesn't need the
    // separated or orbiting positioning tried earlier.
    const torusWire = new THREE.LineSegments(knotEdges, knotMat);
    scene.add(torusWire);

    const starCount = window.innerWidth < 720 ? 260 : 640;
    const positions = new Float32Array(starCount * 3);
    const colorAttr = new Float32Array(starCount * 3);
    const palette = [
      new THREE.Color(0x00e5ff),
      new THREE.Color(0xff3ec9),
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0x5eead4),
    ];
    for (let i = 0; i < starCount; i++) {
      const r = 3.0 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      colorAttr[i * 3] = c.r;
      colorAttr[i * 3 + 1] = c.g;
      colorAttr[i * 3 + 2] = c.b;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(colorAttr, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Returns null on phones and for reduced-motion visitors, in which case the
    // scene falls back to a plain render below.
    const post = createBloomComposer(renderer, scene, camera, { strength: 0.62, radius: 0.55, threshold: 0.5 });

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (post) post.setSize(w, h);
    }
    resize();

    const mouse = { x: 0, y: 0 };
    function onMouseMove(e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", resize);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (ro && container) ro.observe(container);

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    function onPointerDown(e) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      try {
        container.setPointerCapture(e.pointerId);
      } catch (err) {
        /* noop */
      }
      container.style.cursor = "grabbing";
    }
    function onPointerMove(e) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      wireframe.rotation.y += dx * 0.006;
      wireframe.rotation.x += dy * 0.006;
      torusWire.rotation.y -= dx * 0.004;
      torusWire.rotation.x += dy * 0.004;
      lastX = e.clientX;
      lastY = e.clientY;
    }
    function onPointerUp(e) {
      dragging = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch (err) {
        /* noop */
      }
      container.style.cursor = "grab";
    }

    if (finePointer && !reduced) {
      container.style.pointerEvents = "auto";
      container.style.cursor = "grab";
      container.addEventListener("pointerdown", onPointerDown);
      container.addEventListener("pointermove", onPointerMove);
      container.addEventListener("pointerup", onPointerUp);
      container.addEventListener("pointercancel", onPointerUp);
    }

    let raf = null;
    let running = true;

    function animate() {
      if (!running) {
        raf = null;
        return;
      }
      wireframe.rotation.y += 0.0018;
      wireframe.rotation.x += 0.0007;
      torusWire.rotation.y -= 0.0026;
      torusWire.rotation.x += 0.0012;
      stars.rotation.y += 0.0004;
      camera.position.x += (mouse.x * 1.1 - camera.position.x) * 0.02;
      camera.position.y += (-mouse.y * 0.8 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);
      if (post) post.render();
      else renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }

    let io = null;
    if (reduced) {
      if (post) post.render();
      else renderer.render(scene, camera);
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
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
      if (ro) ro.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      icoGeo.dispose();
      icoEdges.dispose();
      icoMat.dispose();
      knotGeo.dispose();
      knotEdges.dispose();
      knotMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      if (post) post.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="hero-3d" aria-hidden="true" />;
}
