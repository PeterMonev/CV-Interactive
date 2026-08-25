import { useReducer } from "react";

// A counter a WebGL scene can bump to rebuild itself from scratch.
//
// Browsers hand out a fixed number of WebGL contexts per process — sixteen in
// Chrome — and this page holds ten of them. Open a couple of other tabs that
// use the GPU and the browser takes them back, oldest first. Measured on this
// site: under context pressure all ten canvases were evicted at once, and
// because nothing listened for the event, none of them ever came back. The
// visitor was left with a page whose every 3D scene had silently gone black
// until they thought to reload.
//
// Each scene builds everything inside one effect and disposes everything in its
// cleanup, so the cheapest correct recovery is to run that effect again. Adding
// this counter to the dependency array turns "rebuild the scene" into one call.
export function useSceneGeneration() {
  return useReducer((n) => n + 1, 0);
}
