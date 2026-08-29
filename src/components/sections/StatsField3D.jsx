import { useEffect, useRef } from "react";
import * as THREE from "three";
import { tuneRenderer, guardContext, createRenderer, retryScene } from "../../utils/gfx.js";
import { bloomSupported, createBloomComposer } from "../../utils/bloom.js";
import { createNebulae } from "../../utils/nebula.js";
import { createSpawn } from "../../utils/spawn.js";
import { useSceneGeneration } from "../../hooks/useSceneGeneration.js";
import { prefersReducedMotion } from "../../utils/motion.js";
import { makeGlowSpriteTexture, makeStatLabelSprite } from "../../utils/canvasTextures.js";

// The four headline numbers, as a system rather than a diagram.
//
// They used to be pinned at fixed coordinates inside a rotating group, which
// meant the labels swung behind the wireframe and out of the frame as the whole
// thing turned. Each figure now holds its own inclined orbit around the core,
// keeps its label beside it, and fades as it passes behind — the same depth
// language the certificate cloud already speaks, so the two sections read as
// one site instead of two experiments.
export function StatsField3D({ stats }) {
  const mountRef = useRef(null);

  const [generation, rebuildScene] = useSceneGeneration();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();

    const scene = new THREE.Scene();
    const FOV = 46;
    const CAM_Z = 6.4;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 20);
    camera.position.set(0, 0, CAM_Z);
    camera.lookAt(0, 0, 0);

    const useBloom = bloomSupported();
    const renderer = createRenderer({ antialias: true, alpha: true }, { toneMap: useBloom });
    if (!renderer) return retryScene(rebuildScene, { attempt: generation });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    const unguardContext = guardContext(renderer, rebuildScene, { attempt: generation });


    // the label sprites are the brightest thing here, so the threshold sits above them

    const post = createBloomComposer(renderer, scene, camera, { strength: 0.7, radius: 0.45, threshold: 0.4 });

    const nebulae = createNebulae(scene, { distance: 6.4 });

    const group = new THREE.Group();
    scene.add(group);

    // The core: a lit shell inside a wire cage inside a wider, slower cage.
    // One wireframe on its own reads as a diagram; three layers at different
    // rates read as an object with a volume.
    const coreUniforms = {
      uTime: { value: 0 },
      uHot: { value: new THREE.Color(0x00e5ff) },
      uCool: { value: new THREE.Color(0x8b5cf6) },
    };
    const coreMat = new THREE.ShaderMaterial({
      uniforms: coreUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uHot;
        uniform vec3 uCool;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          // bright at the silhouette, hollow through the middle, so it glows
          // like a shell rather than sitting there as a solid ball
          float facing = abs(dot(normalize(vNormal), normalize(vView)));
          float rim = pow(1.0 - facing, 2.4);
          float breathe = 0.86 + 0.14 * sin(uTime * 1.5);
          vec3 col = mix(uCool, uHot, rim);
          gl_FragColor = vec4(col * breathe, rim * 0.72 + 0.05);
        }
      `,
    });
    const coreGeo = new THREE.IcosahedronGeometry(1.16, 2);
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const icoGeo = new THREE.IcosahedronGeometry(1.5, 1);
    const icoEdges = new THREE.EdgesGeometry(icoGeo);
    const icoMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.55,
    });
    const wireframe = new THREE.LineSegments(icoEdges, icoMat);
    group.add(wireframe);

    const shellGeo = new THREE.IcosahedronGeometry(2.05, 1);
    const shellEdges = new THREE.EdgesGeometry(shellGeo);
    const shellMat = new THREE.LineBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.2,
    });
    const shell = new THREE.LineSegments(shellEdges, shellMat);
    group.add(shell);

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

    // A tether from the core to each figure, brightest at the figure. Rebuilt
    // every frame because the markers move.
    const linkPositions = new Float32Array(stats.length * 6);
    const linkColors = new Float32Array(stats.length * 6);
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
    linkGeo.setAttribute("color", new THREE.BufferAttribute(linkColors, 3));
    const linkMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const links = new THREE.LineSegments(linkGeo, linkMat);
    group.add(links);

    const glowTexture = makeGlowSpriteTexture();
    const markers = stats.map((s, i) => {
      const color = new THREE.Color(s.color);
      const dot = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture,
          color,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      dot.scale.set(0.5, 0.5, 1);
      group.add(dot);

      const label = makeStatLabelSprite(`${s.value} ${s.label}`, s.color);
      group.add(label);

      return {
        dot,
        label,
        color,
        labelWidth: label.scale.x,
        // spread around the circle, each on its own tilted plane so the four
        // orbits never collapse into one ring seen edge-on
        phase: (i / stats.length) * Math.PI * 2,
        speed: 0.16 + i * 0.026,
        tilt: -0.5 + i * 0.34,
        wobble: Math.random() * Math.PI * 2,
      };
    });

    // Fitted to the box rather than fixed, because this canvas is as wide as
    // the About column and only 420px tall — a radius chosen for one aspect
    // pushes the labels off the edge at another.
    let orbitRadius = 2.4;
    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      if (post) post.setSize(w, h);
      const halfH = Math.tan((FOV / 2) * (Math.PI / 180)) * CAM_Z;
      const halfW = halfH * camera.aspect;
      const widestLabel = markers.reduce((m, k) => Math.max(m, k.labelWidth), 0);
      orbitRadius = Math.max(1.9, Math.min(halfW - widestLabel * 0.7, halfH * 0.86));
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
    const world = new THREE.Vector3();
    const projected = new THREE.Vector3();

    // Each figure is flung out of the core to its own orbit as you arrive,
    // one after another, which is also what makes the four read as belonging
    // to one system rather than as four markers that happen to be nearby.
    const spawn = createSpawn({ skip: reduced });

    function placeMarkers(t) {
      const posAttr = linkGeo.attributes.position;
      const colAttr = linkGeo.attributes.color;

      markers.forEach((m, i) => {
        const arrive = spawn.at(i);
        const reach = orbitRadius * arrive;
        const angle = m.phase + t * m.speed;
        const x = Math.cos(angle) * reach;
        const z = Math.sin(angle) * reach;
        const y = Math.sin(angle) * Math.sin(m.tilt) * reach * 0.55
          + Math.sin(t * 0.9 + m.wobble) * 0.08;
        const zt = z * Math.cos(m.tilt);

        m.dot.position.set(x, y, zt);
        // the label sits outward from the core so it never crosses it
        const out = Math.hypot(x, zt) || 1;
        m.label.position.set(
          x + (x / out) * (m.labelWidth * 0.5 + 0.22),
          y + 0.05,
          zt + (zt / out) * 0.1
        );

        // How much of the marker is facing us. The far half only darkens: a
        // figure that fades out is a figure the reader has to wait for, and
        // half the orbit spent waiting made the set look broken rather than
        // deep. Floors are high and the curve is linear, so the back of the
        // ring reads as shaded, never as absent.
        m.dot.getWorldPosition(world);
        const front = (world.z / orbitRadius + 1) * 0.5;
        const focus = Math.max(0, Math.min(1, front));
        const near = 0.82 + focus * 0.24;

        const pulse = 1 + Math.sin(t * 2.4 + m.wobble) * 0.18;
        m.dot.scale.set(0.42 * pulse * near, 0.42 * pulse * near, 1);
        const fade = spawn.linear(i);

        // A figure passing in front of the core projects onto the middle of the
        // frame, which is exactly where the core is drawn — the label lands on
        // top of it and neither can be read. Measured in screen space rather
        // than in the scene, because that is where the collision happens.
        projected.copy(world).project(camera);
        const fromCentre = Math.hypot(projected.x * camera.aspect, projected.y);
        const screenPull = Math.min(1, Math.max(0, (fromCentre - 0.12) / 0.22));
        // only the near half is a problem: a label behind the core is occluded
        // anyway, and dimming it there would just make the far side emptier
        const overCore = focus > 0.5 ? screenPull : 1;

        m.dot.material.opacity = (0.74 + focus * 0.26) * fade;
        m.label.material.opacity = (0.66 + focus * 0.34) * fade * overCore;
        m.label.scale.set(m.labelWidth * near, 0.4 * near, 1);

        posAttr.setXYZ(i * 2, 0, 0, 0);
        posAttr.setXYZ(i * 2 + 1, x, y, zt);
        const dim = 0.16 + focus * 0.12;
        colAttr.setXYZ(i * 2, m.color.r * dim, m.color.g * dim, m.color.b * dim);
        colAttr.setXYZ(
          i * 2 + 1,
          m.color.r * (0.62 + focus * 0.38),
          m.color.g * (0.62 + focus * 0.38),
          m.color.b * (0.62 + focus * 0.38)
        );
      });

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }

    function animate() {
      if (!running) {
        raf = null;
        return;
      }
      if (!reduced) {
        const t = performance.now() * 0.001;
        nebulae.update(t);
        coreUniforms.uTime.value = t;
        core.rotation.y -= 0.0016;
        core.rotation.x += 0.0006;
        wireframe.rotation.y += 0.0022;
        wireframe.rotation.x += 0.0008;
        // against the cage, so the two never lock into one rigid shape
        shell.rotation.y -= 0.0013;
        shell.rotation.z += 0.0005;
        if (!dragging) {
          group.rotation.y += 0.0009;
        }
        coreGlow.material.opacity = 0.4 + Math.sin(t * 1.6) * 0.12;
        placeMarkers(t);
      }
      if (post) post.render();

      else renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }

    let io = null;
    if (reduced) {
      placeMarkers(0);
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
      glowTexture.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      });
      if (post) post.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [stats, generation]);

  return <div ref={mountRef} className="stats-3d" aria-hidden="true" />;
}
