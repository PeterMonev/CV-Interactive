import { useEffect, useRef } from "react";
import * as THREE from "three";
import { prefersReducedMotion } from "../../utils/motion.js";
import { makeCertBadgeTexture } from "../../utils/canvasTextures.js";
import { CERT_FALLBACK_URL, CERT_PALETTE } from "../../data/certificates.js";
import { track, EVENTS } from "../../utils/analytics.js";

export function CertificateCloud3D({ certs }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.z = 11;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.rotation.x = -0.15;
    scene.add(group);

    // glowing achievement core at the center
    const coreGeo = new THREE.IcosahedronGeometry(0.4, 1);
    const coreEdges = new THREE.EdgesGeometry(coreGeo);
    const coreMat = new THREE.LineBasicMaterial({
      color: 0xeef1fb,
      transparent: true,
      opacity: 0.8,
    });
    const core = new THREE.LineSegments(coreEdges, coreMat);
    group.add(core);

    const coreGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: (() => {
          const c = document.createElement("canvas");
          c.width = 128;
          c.height = 128;
          const gctx = c.getContext("2d");
          const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
          grad.addColorStop(0, "rgba(238,241,251,0.9)");
          grad.addColorStop(1, "rgba(238,241,251,0)");
          gctx.fillStyle = grad;
          gctx.fillRect(0, 0, 128, 128);
          return new THREE.CanvasTexture(c);
        })(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    coreGlow.scale.set(1.6, 1.6, 1);
    group.add(coreGlow);

    const n = certs.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const sphereRadius = 4.6;
    const badges = [];
    const linePositions = [];
    const lineColors = [];

    certs.forEach((cert, i) => {
      const y = n > 1 ? 1 - (i / (n - 1)) * 2 : 0;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      const pos = new THREE.Vector3(x, y, z).multiplyScalar(sphereRadius);

      const colorHex = CERT_PALETTE[i % CERT_PALETTE.length];
      const colorObj = new THREE.Color(colorHex);

      const texture = makeCertBadgeTexture(cert.name, colorHex);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      const baseScaleX = 2.05;
      const baseScaleY = 1.04;
      sprite.scale.set(baseScaleX, baseScaleY, 1);
      sprite.position.copy(pos);
      sprite.userData.cert = cert;
      sprite.userData.basePos = pos.clone();
      sprite.userData.phase = Math.random() * Math.PI * 2;
      sprite.userData.baseScaleX = baseScaleX;
      sprite.userData.baseScaleY = baseScaleY;
      sprite.userData.hoverT = 0;
      group.add(sprite);
      badges.push(sprite);

      linePositions.push(0, 0, 0, pos.x, pos.y, pos.z);
      lineColors.push(
        colorObj.r,
        colorObj.g,
        colorObj.b,
        colorObj.r,
        colorObj.g,
        colorObj.b
      );
    });

    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(linePositions, 3)
    );
    linesGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(lineColors, 3)
    );
    const linesMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
    });
    const connectorLines = new THREE.LineSegments(linesGeo, linesMat);
    group.add(connectorLines);

    // ambient drifting particles for depth
    const dustCount = window.innerWidth < 720 ? 60 : 130;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const r = sphereRadius * (0.55 + Math.random() * 0.85);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dustPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      dustPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x8d97b5,
      size: 0.035,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

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

    const raycaster = new THREE.Raycaster();
    function getNDC(e) {
      const rect = container.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      };
    }
    function pickSprite(e) {
      const ndc = getNDC(e);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(badges, false);
      return hits.length ? hits[0].object : null;
    }

    let hovered = null;
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
      if (pointerDown) {
        const totalDx = e.clientX - startX;
        const totalDy = e.clientY - startY;
        if (!dragging && Math.hypot(totalDx, totalDy) > 4) {
          dragging = true;
          hovered = null;
          container.style.cursor = "grabbing";
        }
        if (dragging) {
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          group.rotation.y += dx * 0.006;
          group.rotation.x += dy * 0.006;
          lastX = e.clientX;
          lastY = e.clientY;
        }
      } else {
        hovered = pickSprite(e);
        container.style.cursor = hovered ? "pointer" : "grab";
      }
    }
    function onPointerUp(e) {
      if (pointerDown && !dragging) {
        const hit = pickSprite(e);
        if (hit) {
          const cert = hit.userData.cert;
          track(EVENTS.CERT_OPEN, { name: cert.name, view: "3d" });
          window.open(cert.url || CERT_FALLBACK_URL, "_blank", "noopener,noreferrer");
        }
      }
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
        group.rotation.y += 0.0012;
        core.rotation.y += 0.006;
        core.rotation.x += 0.003;
        const pulse = 1 + Math.sin(t * 2) * 0.12;
        core.scale.set(pulse, pulse, pulse);
        coreGlow.scale.set(1.5 + Math.sin(t * 2) * 0.25, 1.5 + Math.sin(t * 2) * 0.25, 1);
        dust.rotation.y += 0.0003;

        badges.forEach((sprite) => {
          const bob = Math.sin(t * 0.6 + sprite.userData.phase) * 0.1;
          const dir = sprite.userData.basePos.clone().normalize();
          sprite.position
            .copy(sprite.userData.basePos)
            .addScaledVector(dir, bob);

          const targetT = sprite === hovered ? 1 : 0;
          sprite.userData.hoverT += (targetT - sprite.userData.hoverT) * 0.15;
          const mul = 1 + sprite.userData.hoverT * 0.16;
          sprite.scale.set(
            sprite.userData.baseScaleX * mul,
            sprite.userData.baseScaleY * mul,
            1
          );
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
      coreGeo.dispose();
      coreEdges.dispose();
      coreMat.dispose();
      coreGlow.material.map.dispose();
      coreGlow.material.dispose();
      linesGeo.dispose();
      linesMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      badges.forEach((sprite) => {
        sprite.material.map.dispose();
        sprite.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [certs]);

  return <div ref={mountRef} className="cert-3d" aria-hidden="true" />;
}
