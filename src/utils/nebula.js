import * as THREE from "three";
import { makeNebulaTexture } from "./canvasTextures.js";

// Coloured cloud behind a scene.
//
// Bright objects on pure black read as a diagram: correct, legible, and airless.
// A few very soft bands in the site palette put something behind them, so a
// scene reads as somewhere rather than as shapes on a dark page. Written once
// here because five scenes want the same thing, and five copies of it would
// drift apart the first time one of them was adjusted.
//
// Two details do the work. The texture is a scatter of soft blobs along a
// horizontal band rather than one radial gradient, because a radial gradient is
// a circle and the eye reads a circle as a point of light however large it is.
// And each band is stretched wide and shallow and laid at its own angle, so
// three of them never line up into a single smear.

// The site's violet and cyclamen, pushed to a deeper saturation for this one
// use. Measured as (max-min)/max on the rendered pixels, the violet sat at
// 0.63 and the cyclamen at 0.76, and the violet is the one lying over most
// of the frame — so the wash took its colour from the palest of the three.
// Hue is unchanged on both; only the darkest channel moves. The cyan was
// already at 1.0 and stays as it is.
const DEFAULT_COLORS = [0x6525f6, 0x00e5ff, 0xff1fc0];

// Sized against the camera distance, so a scene viewed from 6 units away and one
// viewed from 11 get clouds that fill a comparable part of the frame.
export function createNebulae(scene, { distance = 9, strength = 1, colors = DEFAULT_COLORS } = {}) {
  const unit = distance / 9.6;
  const specs = [
    { color: colors[0], pos: [-1.7 * unit, 0.9 * unit, -6.6 * unit], w: 62, h: 19.5, tilt: 0.42, opacity: 0.55, drift: 0.09 },
    { color: colors[1], pos: [4.2 * unit, -2.0 * unit, -7.6 * unit], w: 49, h: 15.5, tilt: -0.3, opacity: 0.42, drift: 0.07 },
    { color: colors[2], pos: [-2.9 * unit, 2.7 * unit, -8.6 * unit], w: 40, h: 13, tilt: 0.95, opacity: 0.34, drift: 0.12 },
  ];

  const textures = [makeNebulaTexture(7), makeNebulaTexture(23), makeNebulaTexture(41)];

  // Noise painted into the texture is averaged away by the same
  // magnification that causes the banding — bilinear filtering smooths it
  // out long before it reaches a pixel. Dithering has to happen at the size
  // the bands appear at, which is the screen, so it goes in the fragment
  // shader and is scaled by the fragment's own alpha: the additive result
  // then carries about one level of noise wherever it lands.
  const ditherFragment = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        [
          "float nebDither(vec2 p) {",
          "  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);",
          "}",
          "void main() {",
        ].join(String.fromCharCode(10))
      )
      .replace(
        "#include <opaque_fragment>",
        [
          "#include <opaque_fragment>",
          "gl_FragColor.rgb += (nebDither(gl_FragCoord.xy) - 0.5) * (2.5 / 255.0) / max(gl_FragColor.a, 0.02);",
        ].join(String.fromCharCode(10))
      );
  };

  const clouds = specs.map((spec, i) => {
    const material = new THREE.SpriteMaterial({
      map: textures[i],
      color: spec.color,
      transparent: true,
      opacity: spec.opacity * strength,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      // behind everything without competing for depth against the scene
      depthTest: false,
      rotation: spec.tilt,
    });
    material.onBeforeCompile = ditherFragment;
    material.customProgramCacheKey = () => "nebula-dither";
    const sprite = new THREE.Sprite(material);
    sprite.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    sprite.scale.set(spec.w * unit, spec.h * unit, 1);
    sprite.renderOrder = -10 + i;
    scene.add(sprite);
    return {
      sprite,
      base: spec.opacity * strength,
      w: spec.w * unit,
      h: spec.h * unit,
      tilt: spec.tilt,
      drift: spec.drift,
      phase: i * 2.1,
    };
  });

  return {
    // Slow enough that nothing appears to move while you look at it, and
    // different enough per cloud that the three never breathe in unison.
    update(t) {
      for (const c of clouds) {
        const breathe = 1 + Math.sin(t * c.drift * 2.4 + c.phase) * 0.05;
        c.sprite.scale.set(c.w * breathe, c.h * breathe, 1);
        c.sprite.material.opacity = c.base * (0.85 + Math.sin(t * c.drift + c.phase) * 0.15);
        c.sprite.material.rotation = c.tilt + Math.sin(t * c.drift * 0.5 + c.phase) * 0.05;
      }
    },
    dispose() {
      for (const c of clouds) {
        scene.remove(c.sprite);
        c.sprite.material.dispose();
      }
      for (const texture of textures) texture.dispose();
    },
  };
}
