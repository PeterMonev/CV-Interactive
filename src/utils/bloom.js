import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SavePass } from "three/examples/jsm/postprocessing/SavePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { prefersReducedMotion } from "./motion.js";

// Bloom over a transparent canvas takes one more step than the usual recipe.
//
// These scenes render onto nothing — the page's own gradient shows through — and
// UnrealBloomPass does not carry the scene's alpha through its composite; it
// writes opaque pixels. Left alone that turns the canvas into a solid rectangle
// that hides the background behind it, and separately the glow would be clipped
// to each object's silhouette because empty pixels stay fully transparent.
//
// So the scene's alpha is copied off before the bloom runs, and the final pass
// rebuilds it: whatever was solid stays solid, and empty pixels become visible
// only in proportion to how much light actually spilled onto them.
const RestoreAlphaShader = {
  uniforms: {
    tDiffuse: { value: null },
    tOriginal: { value: null },
    glowFloor: { value: 0.015 },
    glowCeil: { value: 0.5 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tOriginal;
    uniform float glowFloor;
    uniform float glowCeil;
    varying vec2 vUv;
    void main() {
      vec4 bloomed = texture2D(tDiffuse, vUv);
      float sceneAlpha = texture2D(tOriginal, vUv).a;
      float luma = dot(bloomed.rgb, vec3(0.2126, 0.7152, 0.0722));
      float spill = smoothstep(glowFloor, glowCeil, luma);
      gl_FragColor = vec4(bloomed.rgb, max(sceneAlpha, spill));
    }
  `,
};

// Post-processing costs several extra full-screen passes every frame. Worth it
// on a desktop for the two scenes that carry the page; not worth it on a phone,
// and not wanted by anyone who asked for reduced motion.
export function bloomSupported() {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  // Above a phone in either orientation: a large iPhone in landscape reports
  // somewhere around 850, and 768 let it through — which meant a rotated phone
  // still paid for the tone mapping that only bloom justifies.
  return window.innerWidth >= 1024;
}

export function createBloomComposer(renderer, scene, camera, options = {}) {
  if (!bloomSupported()) return null;

  const {
    strength = 0.55,
    radius = 0.5,
    threshold = 0.55,
    glowFloor = 0.015,
    glowCeil = 0.5,
  } = options;

  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  renderPass.clearAlpha = 0;
  composer.addPass(renderPass);

  const savePass = new SavePass(
    new THREE.WebGLRenderTarget(1, 1, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    })
  );
  composer.addPass(savePass);

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    strength,
    radius,
    threshold
  );
  composer.addPass(bloom);

  const restore = new ShaderPass(RestoreAlphaShader);
  restore.uniforms.tOriginal.value = savePass.renderTarget.texture;
  restore.uniforms.glowFloor.value = glowFloor;
  restore.uniforms.glowCeil.value = glowCeil;
  composer.addPass(restore);

  return {
    render: () => composer.render(),
    setSize: (w, h) => {
      composer.setSize(w, h);
      bloom.setSize(w, h);
      savePass.renderTarget.setSize(w, h);
    },
    bloom,
    restore,
    dispose: () => {
      savePass.renderTarget.dispose();
      bloom.dispose();
      composer.dispose();
    },
  };
}
