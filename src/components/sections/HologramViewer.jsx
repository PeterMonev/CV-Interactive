import { useEffect, useRef } from "react";
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { tuneRenderer, tuneTexture } from "../../utils/gfx.js";
import { makeGlowSpriteTexture } from "../../utils/canvasTextures.js";
import { prefersReducedMotion } from "../../utils/motion.js";

export function HologramViewer({ projects, activeIndex }) {
  const mountRef = useRef(null);
  const planeMatRef = useRef(null);
  const texturesRef = useRef({});
  const activeIndexRef = useRef(activeIndex);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    const proj = projects[activeIndex];
    const mat = planeMatRef.current;
    if (proj && mat && texturesRef.current[proj.name]) {
      mat.map = texturesRef.current[proj.name];
      mat.opacity = 0.95;
      mat.needsUpdate = true;
    }
  }, [activeIndex, projects]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20);
    camera.position.set(0, 0.1, 6.2);
    camera.lookAt(0, 0.1, 0);

    const renderer = tuneRenderer(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Tube radii of 0.025 and 0.018 are thinner than a pixel at this distance,
    // so the emitter rings shimmered and dropped out as the rig turned. Built
    // as lines they hold a real width whatever the screen.
    const lineMaterials = [];
    function makeRing(radius, colorHex, width, opacity) {
      const STEPS = 96;
      const pts = [];
      for (let i = 0; i < STEPS; i++) {
        const a0 = (i / STEPS) * Math.PI * 2;
        const a1 = ((i + 1) / STEPS) * Math.PI * 2;
        pts.push(
          Math.cos(a0) * radius, 0, Math.sin(a0) * radius,
          Math.cos(a1) * radius, 0, Math.sin(a1) * radius
        );
      }
      const geo = new LineSegmentsGeometry();
      geo.setPositions(pts);
      const mat = new LineMaterial({
        color: colorHex,
        transparent: true,
        opacity,
        linewidth: width,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      lineMaterials.push(mat);
      const ring = new LineSegments2(geo, mat);
      ring.position.y = -1.55;
      group.add(ring);
      return { ring, mat, geo };
    }
    const outer = makeRing(1.7, 0x00e5ff, 2.4, 0.85);
    const inner = makeRing(1.2, 0x5eead4, 1.8, 0.7);

    const beamGeo = new THREE.CylinderGeometry(0.05, 1.3, 3.1, 24, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    group.add(beam);

    // Motes drifting up the cone. Without them the beam is an empty shape; with
    // them it reads as air full of light, which is the whole idea of the room.
    const MOTE_COUNT = 90;
    const motePositions = new Float32Array(MOTE_COUNT * 3);
    const moteSeed = [];
    for (let i = 0; i < MOTE_COUNT; i++) {
      moteSeed.push({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random(),
        y: Math.random(),
        speed: 0.04 + Math.random() * 0.07,
      });
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
    const moteTexture = makeGlowSpriteTexture();
    const moteMat = new THREE.PointsMaterial({
      color: 0x9beaff,
      map: moteTexture,
      size: 0.09,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    group.add(motes);

    const planeGeo = new THREE.PlaneGeometry(3.3, 1.72);
    const planeMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      color: 0xcdefff,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.position.y = 0.35;
    group.add(plane);
    planeMatRef.current = planeMat;

    const scanCanvas = document.createElement("canvas");
    scanCanvas.width = 4;
    scanCanvas.height = 64;
    const sctx = scanCanvas.getContext("2d");
    sctx.clearRect(0, 0, 4, 64);
    sctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let y = 0; y < 64; y += 4) sctx.fillRect(0, y, 4, 1.5);
    const scanTex = tuneTexture(new THREE.CanvasTexture(scanCanvas));
    scanTex.wrapS = THREE.RepeatWrapping;
    scanTex.wrapT = THREE.RepeatWrapping;
    scanTex.repeat.set(1, 14);
    const scanMat = new THREE.MeshBasicMaterial({
      map: scanTex,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.32, 1.74), scanMat);
    scanPlane.position.set(0, 0.35, 0.01);
    group.add(scanPlane);

    const loader = new THREE.TextureLoader();
    projects.forEach((p, i) => {
      if (!p.images || !p.images[0]) return;
      loader.load(p.images[0], (tex) => {
        tuneTexture(tex, { srgb: true });
        texturesRef.current[p.name] = tex;
        if (i === activeIndexRef.current) {
          planeMat.map = tex;
          planeMat.opacity = 0.95;
          planeMat.needsUpdate = true;
        }
      });
    });

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      lineMaterials.forEach((m) => m.resolution.set(w, h));
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
        group.rotation.y += dx * 0.008;
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
        if (!dragging) {
          group.rotation.y += 0.0018;
        }
        group.position.y = Math.sin(t * 0.7) * 0.06;

        // A flat plane collapses to a hairline once the rig turns past ninety
        // degrees, which reads as broken rather than as rotation. Fading it out
        // as it turns away lets the rig keep spinning and the image bow out.
        const facing = Math.abs(Math.cos(group.rotation.y));
        const visible = Math.pow(facing, 0.6);
        const flicker = 0.86 + Math.sin(t * 6) * 0.06;
        planeMat.opacity = planeMat.map ? Math.min(0.95, flicker) * visible : 0;
        scanMat.opacity = 0.4 * visible;

        scanTex.offset.y -= 0.006;
        // the two rings breathe out of step, so the base never looks like one part
        outer.mat.opacity = 0.7 + Math.sin(t * 2) * 0.15;
        inner.mat.opacity = 0.55 + Math.sin(t * 2 + 1.1) * 0.15;
        beamMat.opacity = 0.14 + Math.sin(t * 1.6) * 0.05;

        // motes ride up the cone, which narrows towards the top
        const motePos = moteGeo.attributes.position;
        for (let i = 0; i < MOTE_COUNT; i++) {
          const m = moteSeed[i];
          m.y = (m.y + m.speed * 0.016) % 1;
          const radiusAtY = 1.3 - m.y * 1.25;
          const r = m.radius * radiusAtY;
          const a = m.angle + m.y * 0.8;
          motePos.setXYZ(i, Math.cos(a) * r, -1.55 + m.y * 3.1, Math.sin(a) * r);
        }
        motePos.needsUpdate = true;
        moteMat.opacity = 0.45 + Math.sin(t * 1.6) * 0.12;
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
      Object.values(texturesRef.current).forEach((tex) => tex.dispose());
      scanTex.dispose();
      moteTexture.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} className="hologram-viewer" aria-hidden="true" />;
}
