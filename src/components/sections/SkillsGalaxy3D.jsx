import { useEffect, useRef } from "react";
import * as THREE from "three";
import { prefersReducedMotion } from "../../utils/motion.js";
import { makeLabelSprite, makeGlowSpriteTexture, makePlanetTexture } from "../../utils/canvasTextures.js";
import { RADAR_DOMAINS } from "../../data/skills.js";

export function SkillsGalaxy3D({ onSelect }) {
  const mountRef = useRef(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 2.6, 9.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // lighting — the sun core is the actual light source, so the planets
    // pick up real shading instead of looking like flat colored dots
    const ambientLight = new THREE.AmbientLight(0x40446a, 0.65);
    scene.add(ambientLight);
    const sunLight = new THREE.PointLight(0xfff4e0, 3.2, 24, 1.6);
    scene.add(sunLight);
    const rimLight = new THREE.DirectionalLight(0x00e5ff, 0.35);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    const systemGroup = new THREE.Group();
    systemGroup.rotation.x = -0.24;
    scene.add(systemGroup);

    // background starfield for depth
    const starCount = window.innerWidth < 720 ? 80 : 160;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 7.5 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x8d97b5,
      size: 0.03,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // the "sun" — bright emissive core, wireframe shell, layered glow
    const sunCoreGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff8ea });
    const sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
    systemGroup.add(sunCore);

    const coreGeo = new THREE.IcosahedronGeometry(0.5, 1);
    const coreEdges = new THREE.EdgesGeometry(coreGeo);
    const coreMat = new THREE.LineBasicMaterial({
      color: 0xeef1fb,
      transparent: true,
      opacity: 0.6,
    });
    const core = new THREE.LineSegments(coreEdges, coreMat);
    systemGroup.add(core);

    const glowTexture = makeGlowSpriteTexture();
    const coreGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    coreGlow.scale.set(2.2, 2.2, 1);
    systemGroup.add(coreGlow);

    const coreLabel = makeLabelSprite("full-stack", "#eef1fb");
    coreLabel.position.set(0, 0.95, 0);
    systemGroup.add(coreLabel);

    const pickMeshes = [];
    const pivots = [];
    const spinners = [];
    const radii = [2.0, 2.9, 3.85, 4.8, 5.75];

    RADAR_DOMAINS.forEach((domain, i) => {
      const radius = radii[i % radii.length];
      const sphereRadius = 0.22 + Math.sqrt(domain.items.length) * 0.12;

      const pivot = new THREE.Object3D();
      pivot.rotation.y = (i / RADAR_DOMAINS.length) * Math.PI * 2;
      systemGroup.add(pivot);

      const orbitRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.005, 8, 96),
        new THREE.MeshBasicMaterial({
          color: domain.color,
          transparent: true,
          opacity: 0.18,
        })
      );
      orbitRing.rotation.x = Math.PI / 2;
      systemGroup.add(orbitRing);

      const bodyGroup = new THREE.Object3D();
      bodyGroup.position.set(radius, 0, 0);
      pivot.add(bodyGroup);

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(sphereRadius * 1.7, 16, 16),
        new THREE.MeshBasicMaterial({
          color: domain.color,
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
        })
      );
      bodyGroup.add(glow);

      const planetTexture = makePlanetTexture(domain.color, i + 1);
      const solid = new THREE.Mesh(
        new THREE.SphereGeometry(sphereRadius, 32, 32),
        new THREE.MeshStandardMaterial({
          map: planetTexture,
          color: 0xffffff,
          roughness: 0.55,
          metalness: 0.12,
          emissive: new THREE.Color(domain.color),
          emissiveIntensity: 0.1,
        })
      );
      solid.userData.domain = domain;
      bodyGroup.add(solid);

      const wire = new THREE.Mesh(
        new THREE.SphereGeometry(sphereRadius * 1.03, 16, 16),
        new THREE.MeshBasicMaterial({
          color: domain.color,
          wireframe: true,
          transparent: true,
          opacity: 0.22,
        })
      );
      wire.userData.domain = domain;
      bodyGroup.add(wire);

      // saturn-style ring, tilt varied per planet for visual variety
      const planetRing = new THREE.Mesh(
        new THREE.RingGeometry(sphereRadius * 1.55, sphereRadius * 2.15, 48),
        new THREE.MeshBasicMaterial({
          color: domain.color,
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      planetRing.rotation.x = Math.PI / 2 + (((i * 37) % 100) / 100 - 0.5) * 0.9;
      planetRing.rotation.z = ((i * 53) % 100) / 100;
      bodyGroup.add(planetRing);

      const label = makeLabelSprite(domain.category, domain.color);
      label.position.set(0, sphereRadius + 0.4, 0);
      bodyGroup.add(label);

      pickMeshes.push(solid, wire);
      pivots.push({ pivot, speed: 0.15 + i * 0.045 });
      spinners.push({ mesh: solid, speed: 0.006 + i * 0.0015 });
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

    const raycaster = new THREE.Raycaster();
    function getNDC(e) {
      const rect = container.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      };
    }
    function pick(e) {
      const ndc = getNDC(e);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(pickMeshes, false);
      return hits.length ? hits[0].object.userData.domain : null;
    }

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
          container.style.cursor = "grabbing";
        }
        if (dragging) {
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          systemGroup.rotation.y += dx * 0.006;
          systemGroup.rotation.x += dy * 0.006;
          lastX = e.clientX;
          lastY = e.clientY;
        }
      } else {
        const hit = pick(e);
        container.style.cursor = hit ? "pointer" : "grab";
      }
    }
    function onPointerUp(e) {
      if (pointerDown && !dragging) {
        const hit = pick(e);
        if (hit && onSelectRef.current) onSelectRef.current(hit);
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
        core.rotation.y += 0.004;
        core.rotation.x += 0.0015;
        const sunPulse = 1 + Math.sin(t * 2.2) * 0.08;
        sunCore.scale.set(sunPulse, sunPulse, sunPulse);
        coreGlow.scale.set(2.1 + Math.sin(t * 2.2) * 0.3, 2.1 + Math.sin(t * 2.2) * 0.3, 1);
        systemGroup.rotation.y += 0.0009;
        starField.rotation.y += 0.0002;
        pivots.forEach(({ pivot, speed }) => {
          pivot.rotation.y += 0.0026 * speed;
        });
        spinners.forEach(({ mesh, speed }) => {
          mesh.rotation.y += speed;
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
  }, []);

  return <div ref={mountRef} className="galaxy-3d" aria-hidden="true" />;
}
