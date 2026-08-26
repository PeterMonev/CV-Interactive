import { useEffect, useRef } from "react";
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { bloomSupported, createBloomComposer } from "../../utils/bloom.js";
import { tuneRenderer, tuneTexture, guardContext, createRenderer, retryScene } from "../../utils/gfx.js";
import { createNebulae } from "../../utils/nebula.js";
import { createSpawn } from "../../utils/spawn.js";
import { useSceneGeneration } from "../../hooks/useSceneGeneration.js";
import { prefersReducedMotion } from "../../utils/motion.js";
import {
  makeCertBadgeTexture,
  makeGlowSpriteTexture,
} from "../../utils/canvasTextures.js";
import { CERT_FALLBACK_URL, CERT_PALETTE } from "../../data/certificates.js";
import { track, EVENTS } from "../../utils/analytics.js";

export function CertificateCloud3D({ certs }) {
  const mountRef = useRef(null);

  const [generation, rebuildScene] = useSceneGeneration();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0e1a, 0.03);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.z = 11;

    const useBloom = bloomSupported();
    const renderer = createRenderer({ antialias: true, alpha: true }, { toneMap: useBloom });
    if (!renderer) return retryScene(rebuildScene, { attempt: generation });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    const unguardContext = guardContext(renderer, rebuildScene, { attempt: generation });

    const nebulae = createNebulae(scene, { distance: 11, strength: 0.85 });

    const group = new THREE.Group();
    group.rotation.x = -0.15;
    scene.add(group);

    // glowing achievement core at the center
    const coreGeo = new THREE.IcosahedronGeometry(0.78, 1);
    const coreEdges = new THREE.EdgesGeometry(coreGeo);
    // LineMaterial converts pixel widths using the canvas size, so each one has
    // to be told when that changes.
    const lineMaterials = [];

    const coreLineGeo = new LineSegmentsGeometry().fromEdgesGeometry(coreEdges);
    const coreMat = new LineMaterial({
      color: 0xeef1fb,
      transparent: true,
      opacity: 0.8,
      linewidth: 1.5,
    });
    lineMaterials.push(coreMat);
    const core = new LineSegments2(coreLineGeo, coreMat);
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
          return tuneTexture(new THREE.CanvasTexture(c));
        })(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    coreGlow.scale.set(2.9, 2.9, 1);
    group.add(coreGlow);

    // badge sprite size, needed both here and by the camera fit below
    // Matches the badge texture aspect (512 x 290). Bigger than it was, because
    // the names were genuinely hard to read at the old size.
    const baseScaleXRef = 2.45;
    const baseScaleYRef = 1.39;

    // see makeCertBadgeTexture: the soft halo is the part phones render wrong
    const haloEnabled = window.innerWidth >= 1024;

    // Depth-driven prominence, narrowed. The front card used to reach 1.55 and
    // the back one 0.62 — two and a half times apart, which at the new card size
    // meant the front row was clipped by the frame while the back row was too
    // small to read. The spread is now under two to one.
    // The front badge reaches FOCUS_MAX_SCALE and full
    // opacity; the one directly behind the core falls to FOCUS_MIN_SCALE and
    // FOCUS_MIN_FADE, which is present enough to read as a cluster and quiet
    // enough to stay out of the way.
    const FOCUS_MIN_SCALE = 0.74;
    const FOCUS_MAX_SCALE = 1.28;
    const FOCUS_MIN_FADE = 0.55;
    const worldPos = new THREE.Vector3();

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

      const texture = makeCertBadgeTexture(cert.name, colorHex, {
        halo: haloEnabled,
      });
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        // driven per frame by depth, so it starts wherever it will settle
        opacity: 1,
      });
      const sprite = new THREE.Sprite(material);
      const baseScaleX = baseScaleXRef;
      const baseScaleY = baseScaleYRef;
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

      // Both ends used to carry the same colour, which drew a flat spoke. Fading
      // the inner end to almost nothing makes each line read as light leaving
      // the core and arriving at its badge, rather than a wire holding it up.
      const INNER = 0.08;
      linePositions.push(0, 0, 0, pos.x, pos.y, pos.z);
      lineColors.push(
        colorObj.r * INNER,
        colorObj.g * INNER,
        colorObj.b * INNER,
        colorObj.r,
        colorObj.g,
        colorObj.b
      );
    });

    const linesGeo = new LineSegmentsGeometry();
    linesGeo.setPositions(linePositions);
    linesGeo.setColors(lineColors);
    const linesMat = new LineMaterial({
      vertexColors: true,
      transparent: true,
      // the gradient does the fading now, so the material can carry more
      opacity: 0.6,
      linewidth: 1.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    lineMaterials.push(linesMat);
    const connectorLines = new LineSegments2(linesGeo, linesMat);
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
    // A PointsMaterial with no map draws hard-edged squares; at this size they
    // read as grit. The soft radial sprite turns them into motes of light, and
    // the size goes up because a feathered edge gives away most of its area.
    const dustTexture = makeGlowSpriteTexture();
    const dustMat = new THREE.PointsMaterial({
      color: 0x8d97b5,
      map: dustTexture,
      size: 0.11,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Returns null on phones and for reduced-motion visitors, in which case the
    // scene falls back to a plain render below.
    const post = createBloomComposer(renderer, scene, camera, { strength: 0.45, radius: 0.45, threshold: 0.68 });

    // A fixed camera distance only frames the cluster at the aspect ratio it was
    // chosen for. A wide desktop box shows 22 units across and the cluster needs
    // 11; a phone in portrait shows 9, so the sphere overflowed and the badges —
    // translucent sprites with a soft halo each — stacked into a milky film.
    // Pulling back on narrow viewports keeps them apart. Desktop is untouched:
    // the floor is the distance that was already in use.
    // Sized for the badges rather than for the sphere. Growing the sphere with
    // the cards pushed the camera back by more than the cards had gained, which
    // would have made them slightly smaller on screen than before.
    const BASE_DISTANCE = 12.2;
    const CLUSTER_WIDTH = sphereRadius * 2 + baseScaleXRef;
    const halfFov = Math.tan((48 / 2) * (Math.PI / 180));

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      const aspect = w / h;
      camera.aspect = aspect;
      const fitWidth = (CLUSTER_WIDTH * 1.06) / (2 * halfFov * aspect);
      camera.position.z = Math.max(BASE_DISTANCE, fitWidth);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      lineMaterials.forEach((m) => m.resolution.set(w, h));
      if (post) post.setSize(w, h);
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
    // Angular velocity carried over from the last drag frame. Releasing a
    // pointer used to stop the cluster dead, which reads like a picture being
    // let go rather than an object being thrown; friction lets it coast.
    let spinY = 0;
    let spinX = 0;
    const DRAG_SENSITIVITY = 0.006;
    const FRICTION = 0.94;
    const MAX_SPIN = 0.09; // a violent flick should not turn into a blur

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
          spinY = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, dx * DRAG_SENSITIVITY));
          spinX = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, dy * DRAG_SENSITIVITY));
          group.rotation.y += spinY;
          group.rotation.x += spinX;
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

    // The badges fly out of the core into the sphere as you arrive. Sixteen
    // staggered one behind another would take half a minute, so they arrive in
    // four waves instead: enough to read as a sequence, short enough to watch.
    const spawn = createSpawn({ skip: reduced, duration: 1200, stagger: 150 });

    let raf = null;
    let running = true;

    function animate() {
      if (!running) {
        raf = null;
        return;
      }
      if (!reduced) {
        const t = performance.now() * 0.001;
        nebulae.update(t);
        if (!pointerDown) {
          group.rotation.y += spinY;
          group.rotation.x += spinX;
        }
        spinY *= FRICTION;
        spinX *= FRICTION;
        // Idle drift fades in only as the throw dies out, so the two never fight.
        const coasting = Math.min(
          1,
          Math.max(Math.abs(spinY), Math.abs(spinX)) / 0.01
        );
        group.rotation.y += 0.0012 * (1 - coasting);
        core.rotation.y += 0.006;
        core.rotation.x += 0.003;
        // The glow swings harder than the shape it wraps, so the breath reads as
        // light spilling out rather than the object itself inflating.
        const beat = Math.sin(t * 2);
        const pulse = 1 + beat * 0.3;
        core.scale.set(pulse, pulse, pulse);
        const glow = 2.8 + beat * 0.75;
        coreGlow.scale.set(glow, glow, 1);
        dust.rotation.y += 0.0003;
        // The connectors are one geometry built once, so they are scaled as a
        // whole rather than rebuilt: without this they hung at full length
        // while the badges they point at were still inside the core.
        const reach = spawn.at(0);
        connectorLines.scale.setScalar(Math.max(0.001, reach));

        badges.forEach((sprite, i) => {
          const bob = Math.sin(t * 0.6 + sprite.userData.phase) * 0.1;
          const dir = sprite.userData.basePos.clone().normalize();
          // four waves rather than sixteen single steps
          const arrive = spawn.at(i % 4);
          sprite.position
            .copy(sprite.userData.basePos)
            .multiplyScalar(arrive)
            .addScaledVector(dir, bob * arrive);

          // How far towards the camera this badge currently sits, 0 at the back
          // of the cluster and 1 at the very front.
          sprite.getWorldPosition(worldPos);
          const front = THREE.MathUtils.clamp(
            (worldPos.z + sphereRadius) / (sphereRadius * 2),
            0,
            1
          );
          // Size and fade want different curves. Sharpening the size makes one
          // or two badges clearly lead; sharpening the fade the same way buried
          // everything behind them, so opacity follows a much gentler slope and
          // never drops below FOCUS_MIN_FADE.
          const focus = Math.pow(front, 2.6);
          const focusFade = Math.pow(front, 1.3);

          const targetT = sprite === hovered ? 1 : 0;
          sprite.userData.hoverT += (targetT - sprite.userData.hoverT) * 0.15;

          const mul =
            FOCUS_MIN_SCALE +
            focus * (FOCUS_MAX_SCALE - FOCUS_MIN_SCALE) +
            sprite.userData.hoverT * 0.16;
          sprite.scale.set(
            sprite.userData.baseScaleX * mul,
            sprite.userData.baseScaleY * mul,
            1
          );
          sprite.material.opacity =
            FOCUS_MIN_FADE + focusFade * (1 - FOCUS_MIN_FADE);
          // the leading badge should also sort above the ones behind it
          sprite.renderOrder = Math.round(focus * 100);
        });
      }
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
            if (running) spawn.begin();
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
      spawn.dispose();
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
      coreLineGeo.dispose();
      coreMat.dispose();
      coreGlow.material.map.dispose();
      coreGlow.material.dispose();
      linesGeo.dispose();
      linesMat.dispose();
      dustGeo.dispose();
      dustTexture.dispose();
      dustMat.dispose();
      badges.forEach((sprite) => {
        sprite.material.map.dispose();
        sprite.material.dispose();
      });
      if (post) post.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [certs, generation]);

  return <div ref={mountRef} className="cert-3d" aria-hidden="true" />;
}
