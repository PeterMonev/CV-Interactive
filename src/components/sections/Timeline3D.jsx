import { useEffect, useRef } from "react";
import * as THREE from "three";
import { prefersReducedMotion } from "../../utils/motion.js";

export function Timeline3D({ count }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
    camera.position.set(0.9, 0, 3.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x40446a, 0.7);
    scene.add(ambient);
    const point = new THREE.PointLight(0xffffff, 1.6, 12);
    point.position.set(1.6, 1, 2.2);
    scene.add(point);

    const segments = 6;
    const curvePoints = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = 3.4 - t * 6.8;
      const x = Math.sin(t * Math.PI * 1.4) * 0.32;
      const z = Math.cos(t * Math.PI * 1.1) * 0.22;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints);

    const tubeGeo = new THREE.TubeGeometry(curve, 120, 0.045, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.45,
      roughness: 0.4,
      metalness: 0.25,
      transparent: true,
      opacity: 0.85,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);

    const nodeCount = Math.max(1, count);
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const t = nodeCount > 1 ? i / (nodeCount - 1) : 0.5;
      const clamped = Math.min(0.94, Math.max(0.06, t));
      const p = curve.getPointAt(clamped);
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xeef1fb,
          emissive: 0x00e5ff,
          emissiveIntensity: 0.6,
          roughness: 0.3,
        })
      );
      node.position.copy(p);
      scene.add(node);
      nodes.push(node);
    }

    const flowCount = 22;
    const flowT = Array.from({ length: flowCount }, (_, i) => i / flowCount);
    const flowPositions = new Float32Array(flowCount * 3);
    const flowGeo = new THREE.BufferGeometry();
    flowGeo.setAttribute("position", new THREE.BufferAttribute(flowPositions, 3));
    const flowMat = new THREE.PointsMaterial({
      color: 0x5eead4,
      size: 0.075,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flow = new THREE.Points(flowGeo, flowMat);
    scene.add(flow);

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resize();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(container);
    window.addEventListener("resize", resize);

    let raf = null;
    let running = true;

    function animate() {
      if (!running) {
        raf = null;
        return;
      }
      if (!reduced) {
        const t = performance.now() * 0.001;
        tubeMat.emissiveIntensity = 0.35 + Math.sin(t * 1.6) * 0.15;
        const posAttr = flowGeo.attributes.position;
        for (let i = 0; i < flowCount; i++) {
          flowT[i] = (flowT[i] + 0.0018) % 1;
          const p = curve.getPointAt(flowT[i]);
          posAttr.setXYZ(i, p.x, p.y, p.z);
        }
        posAttr.needsUpdate = true;
        nodes.forEach((node, i) => {
          const pulse = 1 + Math.sin(t * 2 + i) * 0.15;
          node.scale.set(pulse, pulse, pulse);
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
        { threshold: 0.02 }
      );
      io.observe(container);
      animate();
    }

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      window.removeEventListener("resize", resize);
      if (ro) ro.disconnect();
      tubeGeo.dispose();
      tubeMat.dispose();
      flowGeo.dispose();
      flowMat.dispose();
      nodes.forEach((node) => {
        node.geometry.dispose();
        node.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [count]);

  return <div ref={mountRef} className="timeline-3d" aria-hidden="true" />;
}
