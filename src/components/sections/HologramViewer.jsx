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
    camera.position.set(0, 0.15, 6.1);
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
      ring.position.y = -1.35;
      group.add(ring);
      return { ring, mat, geo };
    }
    const outer = makeRing(2.95, 0x00e5ff, 2.6, 0.85);
    const inner = makeRing(2.15, 0x5eead4, 2.0, 0.7);

    // Wide enough at the screen's height to hold it rather than pass behind it —
    // a cone that narrows to a point where the projection hangs reads as an
    // unrelated shape, which is what made it sit oddly.
    const BEAM_BOTTOM = -1.35;
    const BEAM_HEIGHT = 3.4;
    const beamGeo = new THREE.CylinderGeometry(4.6, 1.8, BEAM_HEIGHT, 44, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = BEAM_BOTTOM + BEAM_HEIGHT / 2;
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

    // A screenshot pinned to a flat rectangle looks like a photo behind glass no
    // matter what is drawn around it. Wrapping it onto a shallow cylinder is
    // what makes it read as a screen: the edges fall away from the viewer, so
    // the surface turns across its width instead of sitting there as one slab.
    const SCREEN_W = 5.4;
    const SCREEN_H = 2.8;
    const SCREEN_RADIUS = 6;

    function makeScreenGeometry(width, height) {
      const arc = width / SCREEN_RADIUS;
      const geo = new THREE.CylinderGeometry(
        SCREEN_RADIUS, SCREEN_RADIUS, height, 48, 1, true, -arc / 2, arc
      );
      // pull the arc back so its middle sits on the origin, not in front of it
      geo.translate(0, 0, -SCREEN_RADIUS);
      return geo;
    }

    const planeGeo = makeScreenGeometry(SCREEN_W, SCREEN_H);
    const planeMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      color: 0xffffff,
    });
    const screenGroup = new THREE.Group();
    group.add(screenGroup);

    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.position.y = 0.85;
    screenGroup.add(plane);
    planeMatRef.current = planeMat;

    // A reflection underneath does more for the sense of a real object standing
    // in a space than any amount of glow around it. Same geometry flipped, faded
    // downwards by an alpha ramp so it dissolves instead of ending on an edge.
    const fadeCanvas = document.createElement("canvas");
    fadeCanvas.width = 4;
    fadeCanvas.height = 128;
    const fctx = fadeCanvas.getContext("2d");
    const fgrad = fctx.createLinearGradient(0, 0, 0, 128);
    fgrad.addColorStop(0, "#000000");
    fgrad.addColorStop(0.55, "#2a2a2a");
    fgrad.addColorStop(1, "#ffffff");
    fctx.fillStyle = fgrad;
    fctx.fillRect(0, 0, 4, 128);
    const fadeTex = tuneTexture(new THREE.CanvasTexture(fadeCanvas));

    const reflectionMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      color: 0x8fd8ff,
      alphaMap: fadeTex,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const reflection = new THREE.Mesh(
      makeScreenGeometry(SCREEN_W, SCREEN_H),
      reflectionMat
    );
    reflection.position.y = 0.85 - SCREEN_H - 0.05;
    reflection.scale.y = -1;
    screenGroup.add(reflection);

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
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const scanPlane = new THREE.Mesh(
      makeScreenGeometry(SCREEN_W * 1.006, SCREEN_H * 1.012),
      scanMat
    );
    scanPlane.position.set(0, 0.85, 0.012);
    screenGroup.add(scanPlane);

    const loader = new THREE.TextureLoader();
    projects.forEach((p, i) => {
      if (!p.images || !p.images[0]) return;
      loader.load(p.images[0], (tex) => {
        tuneTexture(tex, { srgb: true });
        texturesRef.current[p.name] = tex;
        if (i === activeIndexRef.current) {
          planeMat.map = tex;
          planeMat.opacity = 1;
          planeMat.needsUpdate = true;
        }
      });
    });

    const BASE_DISTANCE = 6.1;
    const halfFov = Math.tan((42 / 2) * (Math.PI / 180));

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      const aspect = w / h;
      camera.aspect = aspect;
      // 1.12 leaves a margin so the screen never grazes the edge of the box
      const fitWidth = (SCREEN_W * 1.12) / (2 * halfFov * aspect);
      camera.position.z = Math.max(BASE_DISTANCE, fitWidth);
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

        // Turns with the rig, but never fades below FACE_FLOOR, so the moment it
        // passes edge on is a narrowing rather than a disappearance.
        const FACE_FLOOR = 0.4;
        const facing = Math.abs(Math.cos(group.rotation.y));
        const visible = FACE_FLOOR + (1 - FACE_FLOOR) * Math.sqrt(facing);

        const flicker = 0.97 + Math.sin(t * 6) * 0.03;
        planeMat.opacity = planeMat.map ? Math.min(1, flicker) * visible : 0;
        scanMat.opacity = 0.14 * visible;
        reflectionMat.map = planeMat.map;
        reflectionMat.opacity = planeMat.map ? 0.3 * visible : 0;

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
          const radiusAtY = 1.8 + m.y * 2.8;
          const r = m.radius * radiusAtY;
          const a = m.angle + m.y * 0.8;
          motePos.setXYZ(i, Math.cos(a) * r, BEAM_BOTTOM + m.y * BEAM_HEIGHT, Math.sin(a) * r);
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
      fadeTex.dispose();
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
