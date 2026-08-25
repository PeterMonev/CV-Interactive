import { useEffect, useRef } from "react";
import * as THREE from "three";
import { tuneRenderer, guardContext, createRenderer, retryScene } from "../../utils/gfx.js";
import { createNebulae } from "../../utils/nebula.js";
import { useSceneGeneration } from "../../hooks/useSceneGeneration.js";
import { prefersReducedMotion } from "../../utils/motion.js";
import { makeGlowSpriteTexture } from "../../utils/canvasTextures.js";
import { onContactState } from "../../utils/contactSignal.js";

const COOL = new THREE.Color(0x5eead4);
const HOT = new THREE.Color(0x9ef6ff);
const FAIL = new THREE.Color(0xff3ec9);

export function ContactOrb3D() {
  const mountRef = useRef(null);

  const [generation, rebuildScene] = useSceneGeneration();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;
    const reduced = prefersReducedMotion();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.z = 6;

    const renderer = createRenderer({ antialias: true, alpha: true });
    if (!renderer) return retryScene(rebuildScene, { attempt: generation });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    const unguardContext = guardContext(renderer, rebuildScene, { attempt: generation });

    const nebulae = createNebulae(scene, { distance: 6 });

    const geo = new THREE.TorusKnotGeometry(1.3, 0.34, 140, 14);
    const edges = new THREE.EdgesGeometry(geo, 1);
    const mat = new THREE.LineBasicMaterial({
      color: COOL.clone(),
      transparent: true,
      opacity: 0.36,
    });
    const knot = new THREE.LineSegments(edges, mat);
    scene.add(knot);

    const glowTexture = makeGlowSpriteTexture();

    // The energy the form is gathering, held at the centre of the knot. Dark
    // while the form is empty, so an untouched page looks exactly as calm as
    // it did before.
    const core = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: HOT.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    core.scale.setScalar(1.2);
    scene.add(core);

    // Fires once when a message actually goes out.
    const burstGeo = new THREE.RingGeometry(0.6, 0.72, 64);
    const burstMat = new THREE.MeshBasicMaterial({
      color: HOT.clone(),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const burst = new THREE.Mesh(burstGeo, burstMat);
    scene.add(burst);

    // Motes in the palette, orbiting the knot.
    //
    // Everything that flew past this section came from the page-wide starfield,
    // which is deliberately near-white so it never competes with text — so the
    // last thing a visitor sees before writing to him was the only scene on the
    // site with no colour of its own moving in it. These carry the same four
    // hues the rest of the page uses, and brighten with the message like the
    // knot does.
    const MOTES = 110;
    const motePalette = [
      new THREE.Color(0x00e5ff),
      new THREE.Color(0x5eead4),
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0xff3ec9),
    ];
    const motePositions = new Float32Array(MOTES * 3);
    const moteColors = new Float32Array(MOTES * 3);
    const moteSeeds = [];
    for (let i = 0; i < MOTES; i++) {
      const radius = 1.9 + Math.random() * 1.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      moteSeeds.push({ radius, theta, phi, speed: 0.04 + Math.random() * 0.09 });
      const c = motePalette[i % motePalette.length];
      moteColors[i * 3] = c.r;
      moteColors[i * 3 + 1] = c.g;
      moteColors[i * 3 + 2] = c.b;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
    moteGeo.setAttribute("color", new THREE.BufferAttribute(moteColors, 3));
    const moteMat = new THREE.PointsMaterial({
      map: glowTexture,
      size: 0.13,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    scene.add(motes);

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

    const mouse = { x: 0, y: 0 };
    function onMouseMove(e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener("mousemove", onMouseMove);

    // What the form is doing, and how far along the message is.
    let target = { charge: 0, status: "idle" };
    let charge = 0;
    let burstAt = -1;
    const unsubscribe = onContactState((next) => {
      if (next.status === "sent" && target.status !== "sent") burstAt = performance.now();
      target = next;
    });

    let raf = null;
    let running = true;
    const tint = new THREE.Color();

    function animate() {
      if (!running) {
        raf = null;
        return;
      }
      const now = performance.now();
      const t = now * 0.001;
      nebulae.update(t);

      charge += (target.charge - charge) * 0.06;
      const sending = target.status === "sending";
      const failed = target.status === "error";

      // A knot that turns faster and brighter the closer the message is to
      // being finished, so the page acknowledges the writing without a word.
      const spin = 0.0022 + charge * 0.006 + (sending ? 0.02 : 0);
      knot.rotation.y += spin;
      knot.rotation.x += 0.0009 + mouse.y * 0.0006 + charge * 0.001;
      knot.rotation.z += mouse.x * 0.0004;

      const breathe = 1 + Math.sin(t * 1.6) * 0.02 * (0.3 + charge);
      knot.scale.setScalar((1 + charge * 0.06) * breathe);

      tint.copy(COOL).lerp(HOT, charge);
      if (failed) tint.lerp(FAIL, 0.75);
      mat.color.copy(tint);
      mat.opacity = 0.36 + charge * 0.34 + (sending ? 0.12 : 0);

      core.material.color.copy(tint);
      core.material.opacity = charge * 0.5 + (sending ? 0.25 : 0);
      core.scale.setScalar(0.9 + charge * 1.1 + Math.sin(t * 3) * 0.06 * charge);

      const motePos = moteGeo.attributes.position;
      for (let i = 0; i < MOTES; i++) {
        const m = moteSeeds[i];
        const a2 = m.theta + t * m.speed;
        const sp = Math.sin(m.phi);
        motePos.setXYZ(
          i,
          Math.cos(a2) * sp * m.radius,
          Math.cos(m.phi) * m.radius + Math.sin(t * 0.5 + i) * 0.05,
          Math.sin(a2) * sp * m.radius
        );
      }
      motePos.needsUpdate = true;
      moteMat.opacity = 0.42 + charge * 0.5 + (sending ? 0.15 : 0);
      moteMat.size = 0.11 + charge * 0.06;

      if (burstAt > 0) {
        const age = (now - burstAt) / 1100;
        if (age >= 1) {
          burstAt = -1;
          burstMat.opacity = 0;
        } else {
          const eased = 1 - Math.pow(1 - age, 3);
          burst.scale.setScalar(0.4 + eased * 5.2);
          burstMat.opacity = (1 - age) * 0.85;
          burst.lookAt(camera.position);
        }
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
      unguardContext();
      nebulae.dispose();
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect();
      unsubscribe();
      window.removeEventListener("resize", resize);
      if (ro) ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      geo.dispose();
      edges.dispose();
      mat.dispose();
      moteGeo.dispose();
      moteMat.dispose();
      burstGeo.dispose();
      burstMat.dispose();
      core.material.dispose();
      glowTexture.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [generation]);

  return <div ref={mountRef} className="contact-3d" aria-hidden="true" />;
}
