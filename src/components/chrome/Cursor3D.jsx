import { useEffect, useRef } from "react";
import * as THREE from "three";
import { tuneRenderer, guardContext, createRenderer, retryScene } from "../../utils/gfx.js";
import { useSceneGeneration } from "../../hooks/useSceneGeneration.js";
import { prefersReducedMotion } from "../../utils/motion.js";
import { currentAccent } from "../../utils/cursorAccent.js";

export function Cursor3D() {
  const wrapRef = useRef(null);
  const mountRef = useRef(null);

  const [generation, rebuildScene] = useSceneGeneration();

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    // A touch device has no cursor to replace. Building one anyway spent a
    // WebGL context — of which a phone has far fewer than the sixteen a
    // desktop browser offers — on a scene that can never be seen.
    const finePointer =
      !window.matchMedia ||
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!finePointer) return undefined;

    const wrap = wrapRef.current;
    const container = mountRef.current;
    if (!wrap || !container) return undefined;

    const size = 46;
    let renderer;
    let scene;
    let camera;
    let geo;
    let edges;
    let mat;
    let shape;
    // declared out here on purpose: the cleanup below is outside the try, and a
    // const inside it would not exist by the time unmounting calls it
    let unguardContext = null;

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
      camera.position.z = 3;

      renderer = createRenderer({ antialias: true, alpha: true });
      if (!renderer) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(size, size);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);
      unguardContext = guardContext(renderer, rebuildScene, { attempt: generation });

      geo = new THREE.OctahedronGeometry(0.85, 0);
      edges = new THREE.EdgesGeometry(geo);
      mat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.9 });
      shape = new THREE.LineSegments(edges, mat);
      scene.add(shape);
    } catch (err) {
      // WebGL context unavailable — bail out without touching the native
      // cursor's CSS class, so the OS pointer stays visible as a fallback.
      return undefined;
    }

    // Native cursor is hidden ONLY via this class, toggled here — never by a
    // blanket always-on CSS rule. That keeps the two in sync: if the 3D
    // cursor fails above, we return early and never reach this line, so the
    // native cursor is guaranteed to still be visible instead of neither
    // cursor showing at all.
    document.body.classList.add("cursor3d-active");

    // Replacing the native cursor threw away the two things it was actually
    // telling people: this can be clicked, and this can be typed into. A
    // shape that spins identically over a heading, a button and a text field
    // is decoration standing where a signal used to be.
    //
    // Over anything clickable the octahedron opens and brightens. Over a text
    // field it gets out of the way entirely and the real caret comes back —
    // you cannot aim at a word with a spinning solid.
    const CLICKABLE = 'a[href],button,[role="button"],summary,label[for],select,[tabindex="0"]';
    const TYPEABLE = 'input:not([type="button"]):not([type="submit"]),textarea,[contenteditable="true"]';
    // The four scenes that turn when you hold and drag them. Nothing on a
    // desktop says so except one line of text under some of them, so the
    // cursor says it instead — by doing the thing itself. Over these it stops
    // tumbling and turns steadily about the upright axis, which is the exact
    // motion a drag produces.
    const SPINNABLE = '.stats-3d,.cert-3d,.hologram-viewer,.galaxy-3d';

    const IDLE_SPIN_X = 0.018;
    const IDLE_SPIN_Y = 0.024;

    let pressed = false;
    let overText = false;
    let targetScale = 1;
    let targetOpacity = 0.9;
    let spinX = IDLE_SPIN_X;
    let spinY = IDLE_SPIN_Y;
    let targetSpinX = IDLE_SPIN_X;
    let targetSpinY = IDLE_SPIN_Y;

    function handleMove(e) {
      wrap.style.transform = `translate(${e.clientX - size / 2}px, ${e.clientY - size / 2}px)`;

      const el = e.target instanceof Element ? e.target : null;
      overText = !!(el && el.closest(TYPEABLE));
      const clickable = !overText && !!(el && el.closest(CLICKABLE));

      // clickable wins over spinnable: a real button sitting on top of a
      // scene should read as a button, not as something to drag
      const spinnable = !overText && !clickable && !!(el && el.closest(SPINNABLE));

      wrap.style.opacity = overText ? "0" : "1";
      targetScale = (clickable ? 1.55 : spinnable ? 1.3 : 1) * (pressed ? 0.75 : 1);
      targetOpacity = clickable || spinnable ? 1 : 0.9;
      targetSpinX = spinnable ? 0.002 : IDLE_SPIN_X;
      targetSpinY = spinnable ? 0.075 : IDLE_SPIN_Y;
    }
    function handleDown() {
      pressed = true;
      targetScale *= 0.75;
    }
    function handleUp() {
      pressed = false;
      targetScale /= 0.75;
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);

    let raf = null;
    function animate() {
      spinX += (targetSpinX - spinX) * 0.1;
      spinY += (targetSpinY - spinY) * 0.1;
      shape.rotation.x += spinX;
      shape.rotation.y += spinY;
      // eased rather than set: the shape should arrive at the new size, not
      // jump to it, or crossing a row of links reads as a flicker
      const s = shape.scale.x + (targetScale - shape.scale.x) * 0.2;
      shape.scale.set(s, s, s);
      mat.opacity += (targetOpacity - mat.opacity) * 0.2;
      // sRGB on purpose: the constructor read 0x00e5ff as sRGB, so raw
      // channels here would land a visibly different colour
      const [ar, ag, ab] = currentAccent();
      mat.color.setRGB(ar / 255, ag / 255, ab / 255, THREE.SRGBColorSpace);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      if (unguardContext) unguardContext();
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      document.body.classList.remove("cursor3d-active");
      geo.dispose();
      edges.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [generation]);

  return (
    <div ref={wrapRef} className="cursor-3d-wrap" aria-hidden="true">
      <div ref={mountRef} />
    </div>
  );
}
