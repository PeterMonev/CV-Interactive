import { useEffect, useRef } from "react";
import * as THREE from "three";
import { tuneRenderer, guardContext, createRenderer, retryScene } from "../../utils/gfx.js";
import { bloomSupported, createBloomComposer } from "../../utils/bloom.js";
import { useSceneGeneration } from "../../hooks/useSceneGeneration.js";
import { prefersReducedMotion } from "../../utils/motion.js";
import { makeGlowSpriteTexture } from "../../utils/canvasTextures.js";

// The filament beside the experience cards used to be decoration: a lit rod
// with spheres on it, pulsing on a timer that had nothing to do with the page.
// It now carries the career. Energy fills it from the top as you scroll through
// the section, each job node ignites as the charge reaches it, and the head of
// the charge sits level with whatever you are reading. The scene answers "where
// am I" instead of merely occupying the gutter.
export function Timeline3D({ count }) {
  const mountRef = useRef(null);

  const [generation, rebuildScene] = useSceneGeneration();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();
    const scene = new THREE.Scene();

    const FOV = 45;
    const TUBE_SPAN = 7.4; // the curve covers 6.8 units, plus margin
    const CURVE_TOP = 3.4;
    const CURVE_LEN = 6.8;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 40);
    const camDist = TUBE_SPAN / (2 * Math.tan((FOV / 2) * Math.PI / 180));
    camera.position.set(0, 0, camDist);
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


    // the charge running along the tube is the point, and it should bleed

    const post = createBloomComposer(renderer, scene, camera, { strength: 0.8, radius: 0.5, threshold: 0.4 });

    scene.add(new THREE.AmbientLight(0x40446a, 0.7));
    const point = new THREE.PointLight(0xffffff, 1.6, 12);
    point.position.set(1.6, 1, 2.2);
    scene.add(point);

    const segments = 6;
    const curvePoints = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = CURVE_TOP - t * CURVE_LEN;
      const x = Math.sin(t * Math.PI * 1.4) * 0.16;
      const z = Math.cos(t * Math.PI * 1.1) * 0.12;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints);

    // Unlit on purpose. The filament is a light source, not a lit object, and a
    // standard material spent most of its brightness budget on being shaded.
    // TubeGeometry runs uv.x along the length, which is exactly the axis the
    // fill needs, so the whole effect rides one uniform.
    const tubeUniforms = {
      uFill: { value: reduced ? 1 : 0 },
      uTime: { value: 0 },
      uHot: { value: new THREE.Color(0x00e5ff) },
      uCool: { value: new THREE.Color(0x8b5cf6) },
      uDark: { value: new THREE.Color(0x1b2340) },
    };
    const tubeMat = new THREE.ShaderMaterial({
      uniforms: tubeUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uFill;
        uniform float uTime;
        uniform vec3 uHot;
        uniform vec3 uCool;
        uniform vec3 uDark;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          float charged = smoothstep(uFill + 0.015, uFill - 0.015, vUv.x);
          float head = exp(-pow((vUv.x - uFill) * 26.0, 2.0));
          float pulse = 0.5 + 0.5 * sin(vUv.x * 46.0 - uTime * 3.2);
          vec3 lit = mix(uHot, uCool, vUv.x) * (0.72 + pulse * 0.5);
          vec3 col = mix(uDark, lit, charged) + uHot * head * 1.5;
          float rim = pow(1.0 - abs(vNormal.z), 1.6);
          float alpha = (0.34 + charged * 0.5 + head * 0.7) * (0.55 + rim * 0.65);
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        }
      `,
    });
    const tubeGeo = new THREE.TubeGeometry(curve, 160, 0.075, 12, false);
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);

    const glowTexture = makeGlowSpriteTexture();

    // One node per job, at the point on the curve the card sits beside.
    const nodeCount = Math.max(1, count);
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const t = nodeCount > 1 ? i / (nodeCount - 1) : 0.5;
      const at = Math.min(0.94, Math.max(0.06, t));
      const p = curve.getPointAt(at);

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 18, 18),
        new THREE.MeshStandardMaterial({
          color: 0xeef1fb,
          emissive: 0x00e5ff,
          emissiveIntensity: 0.35,
          roughness: 0.3,
        })
      );
      core.position.copy(p);
      scene.add(core);

      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture,
          color: 0x00e5ff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      halo.position.copy(p);
      halo.scale.setScalar(0.6);
      scene.add(halo);

      nodes.push({ core, halo, at, lit: 0 });
    }

    // The head of the charge, riding the fill position.
    const headSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0x9ef6ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    headSprite.scale.setScalar(0.85);
    scene.add(headSprite);

    // Sparks ride the charged length only, so they read as the energy filling
    // the filament rather than as ambient glitter.
    const flowCount = 26;
    const flowT = Array.from({ length: flowCount }, (_, i) => i / flowCount);
    const flowPhase = Array.from({ length: flowCount }, () => Math.random() * Math.PI * 2);
    const flowPositions = new Float32Array(flowCount * 3);
    const flowAlpha = new Float32Array(flowCount);
    const flowGeo = new THREE.BufferGeometry();
    flowGeo.setAttribute("position", new THREE.BufferAttribute(flowPositions, 3));
    flowGeo.setAttribute("aAlpha", new THREE.BufferAttribute(flowAlpha, 1));
    const flowMat = new THREE.PointsMaterial({
      color: 0x5eead4,
      map: glowTexture,
      size: 0.3,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    // Per-spark fade, so a spark ahead of the head is not simply popped away.
    flowMat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace("void main() {", "attribute float aAlpha;\nvarying float vAlpha;\nvoid main() {")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\n  vAlpha = aAlpha;");
      shader.fragmentShader = shader.fragmentShader
        .replace("void main() {", "varying float vAlpha;\nvoid main() {")
        .replace(
          "#include <opaque_fragment>",
          "#include <opaque_fragment>\n  gl_FragColor.a *= vAlpha;"
        );
    };
    const flow = new THREE.Points(flowGeo, flowMat);
    scene.add(flow);

    // The strip is about 58px wide against a very tall box, so the visible width
    // is a fraction of a unit. Sparks orbiting at a fixed 0.24 spent half their
    // travel outside the frustum; the radius is derived from the aspect instead.
    let flowRadius = 0.12;
    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      if (post) post.setSize(w, h);
      const halfWidth = (TUBE_SPAN / 2) * camera.aspect;
      flowRadius = Math.max(0.05, halfWidth * 0.55);
    }
    resize();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(container);
    window.addEventListener("resize", resize);

    // How far through the experience section the reader is. Measured on the
    // .timeline element rather than on this canvas, because the canvas sits in a
    // parallax layer whose own transform would feed back into the reading.
    const track = container.closest(".timeline") || container;
    let fillTarget = reduced ? 1 : 0;
    function measure() {
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const span = Math.max(1, rect.height * 0.78);
      fillTarget = Math.min(1, Math.max(0, (vh * 0.76 - rect.top) / span));
    }
    if (!reduced) {
      measure();
      window.addEventListener("scroll", measure, { passive: true });
      window.addEventListener("resize", measure);
    }

    let raf = null;
    let running = true;
    let fill = fillTarget;
    const tmp = new THREE.Vector3();

    function animate() {
      if (!running) {
        raf = null;
        return;
      }
      const t = performance.now() * 0.001;
      // Eased toward the scroll reading, so a flick of the wheel arrives as a
      // surge rather than as a jump.
      fill += (fillTarget - fill) * 0.09;
      tubeUniforms.uFill.value = fill;
      tubeUniforms.uTime.value = t;

      const posAttr = flowGeo.attributes.position;
      const alphaAttr = flowGeo.attributes.aAlpha;
      for (let i = 0; i < flowCount; i++) {
        flowT[i] = (flowT[i] + 0.0022) % 1;
        const p = curve.getPointAt(flowT[i]);
        const a = flowT[i] * Math.PI * 7.5 + flowPhase[i];
        posAttr.setXYZ(
          i,
          p.x + Math.cos(a) * flowRadius,
          p.y,
          p.z + Math.sin(a) * flowRadius
        );
        // brightest just behind the head, gone ahead of it
        const behind = fill - flowT[i];
        alphaAttr.setX(i, behind < 0 ? 0 : Math.max(0, 1 - behind * 3.2) * 0.9 + 0.1);
      }
      posAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;

      nodes.forEach((node, i) => {
        const target = fill >= node.at ? 1 : 0;
        node.lit += (target - node.lit) * 0.12;
        const breathe = 1 + Math.sin(t * 2 + i) * 0.08 * node.lit;
        const scale = (0.72 + node.lit * 0.5) * breathe;
        node.core.scale.setScalar(scale);
        node.core.material.emissiveIntensity = 0.3 + node.lit * 1.5;
        node.halo.material.opacity = node.lit * 0.75;
        node.halo.scale.setScalar(0.5 + node.lit * 0.55);
      });

      const headAt = Math.min(0.999, Math.max(0.001, fill));
      curve.getPointAt(headAt, tmp);
      headSprite.position.copy(tmp);
      headSprite.material.opacity = fill > 0.004 && fill < 0.996 ? 0.85 : 0;

      if (post) post.render();


      else renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }

    let io = null;
    if (reduced) {
      nodes.forEach((node) => {
        node.core.material.emissiveIntensity = 1.4;
        node.halo.material.opacity = 0.6;
      });
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
        { threshold: 0.02 }
      );
      io.observe(container);
      animate();
    }

    return () => {
      unguardContext();
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      tubeGeo.dispose();
      tubeMat.dispose();
      flowGeo.dispose();
      flowMat.dispose();
      glowTexture.dispose();
      headSprite.material.dispose();
      nodes.forEach((node) => {
        node.core.geometry.dispose();
        node.core.material.dispose();
        node.halo.material.dispose();
      });
      if (post) post.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [count, generation]);

  return <div ref={mountRef} className="timeline-3d" aria-hidden="true" />;
}
