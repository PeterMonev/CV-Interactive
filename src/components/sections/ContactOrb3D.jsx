import { useEffect, useRef } from "react";
import * as THREE from "three";
import { tuneRenderer } from "../../utils/gfx.js";
import { prefersReducedMotion } from "../../utils/motion.js";
import { makeGlowSpriteTexture } from "../../utils/canvasTextures.js";
import { onContactState } from "../../utils/contactSignal.js";

const COOL = new THREE.Color(0x5eead4);
const HOT = new THREE.Color(0x9ef6ff);
const FAIL = new THREE.Color(0xff3ec9);

export function ContactOrb3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;
    const reduced = prefersReducedMotion();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.z = 6;

    const renderer = tuneRenderer(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

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
      burstGeo.dispose();
      burstMat.dispose();
      core.material.dispose();
      glowTexture.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="contact-3d" aria-hidden="true" />;
}
