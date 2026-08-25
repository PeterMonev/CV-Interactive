import { Component, lazy, Suspense, createElement, useEffect, useRef, useState } from "react";

// Every WebGL scene sits behind React.lazy so three.js — roughly half the
// shipped JavaScript — never lands in the initial bundle. The nav, the hero
// copy and the CV button paint while the three chunk is still in flight, then
// each canvas swaps itself in. The fallback renders the same element the real
// component would, so it reserves the identical box and nothing shifts.
// A decorative scene is never worth a blank page.
//
// Everything below renders inside one React tree, so an exception thrown while
// a scene is building — a refused WebGL context, a shader that will not compile
// on some driver — unmounts everything above it. Measured under context
// pressure: the entire site went white. Each scene now fails alone, leaving the
// same empty box its loading fallback reserves.
class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// Builds a scene only once the reader is close to it.
//
// Ten scenes used to construct themselves the moment the page rendered: ten
// GPU contexts out of the sixteen the browser allows, plus every geometry and
// every generated label texture, all competing with the first paint. Almost
// none of it is on screen. The six that live inside sections now wait until
// they are roughly a viewport away.
//
// Once built, a scene stays built. An earlier version of this idea unmounted
// scenes on the way out, which meant scrolling back up restarted animations
// that had been running — the page kept losing its place.
//
// Two independent triggers, because a scene that never mounts is a far worse
// failure than one that mounts early. IntersectionObserver is the efficient
// signal; a rect read on scroll is the one that still works when observer
// callbacks are not being delivered. Either is enough, and whichever fires
// first detaches the other.
function DeferredScene({ className, children }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near) return undefined;
    let settled = false;
    const check = () => {
      const el = ref.current;
      if (settled || !el) return;
      const rect = el.getBoundingClientRect();
      const margin = window.innerHeight * 1.2;
      if (rect.top < window.innerHeight + margin && rect.bottom > -margin) {
        settled = true;
        setNear(true);
      }
    };
    let io = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting) && !settled) {
            settled = true;
            setNear(true);
          }
        },
        { rootMargin: "120% 0px" }
      );
      if (ref.current) io.observe(ref.current);
    }

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      if (io) io.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [near]);

  // The placeholder is the same element the scene renders, so the box it
  // occupies never changes and nothing shifts when the real thing arrives.
  return near
    ? children
    : createElement("div", { ref, className, "aria-hidden": "true" });
}

function lazy3D(loader, exportName, className, { defer = false } = {}) {
  const Scene = lazy(() =>
    loader().then((mod) => ({ default: mod[exportName] }))
  );
  const fallback = className
    ? createElement("div", { className, "aria-hidden": "true" })
    : null;
  return function Lazy3DBoundary(props) {
    const scene = createElement(
      SceneBoundary,
      { fallback },
      createElement(Suspense, { fallback }, createElement(Scene, props))
    );
    if (!defer) return scene;
    return createElement(DeferredScene, { className }, scene);
  };
}

export const ScrollStarfield = lazy3D(
  () => import("../chrome/ScrollStarfield.jsx"),
  "ScrollStarfield",
  "scroll-starfield"
);
export const Cursor3D = lazy3D(
  () => import("../chrome/Cursor3D.jsx"),
  "Cursor3D",
  "cursor-3d-wrap"
);
// the scroll-to-top button is fixed-position and hidden until you scroll, so it
// has no box to reserve — null fallback is correct here
export const ScrollToTopButton = lazy3D(
  () => import("../chrome/ScrollToTopButton.jsx"),
  "ScrollToTopButton",
  null
);
export const Hero3D = lazy3D(
  () => import("../sections/Hero3D.jsx"),
  "Hero3D",
  "hero-3d"
);
export const StatsField3D = lazy3D(
  () => import("../sections/StatsField3D.jsx"),
  "StatsField3D",
  "stats-3d",
  { defer: true }
);
export const Timeline3D = lazy3D(
  () => import("../sections/Timeline3D.jsx"),
  "Timeline3D",
  "timeline-3d",
  { defer: true }
);
export const CertificateCloud3D = lazy3D(
  () => import("../sections/CertificateCloud3D.jsx"),
  "CertificateCloud3D",
  "cert-3d",
  { defer: true }
);
export const SkillsGalaxy3D = lazy3D(
  () => import("../sections/SkillsGalaxy3D.jsx"),
  "SkillsGalaxy3D",
  "galaxy-3d",
  { defer: true }
);
export const HologramViewer = lazy3D(
  () => import("../sections/HologramViewer.jsx"),
  "HologramViewer",
  "hologram-viewer",
  { defer: true }
);
export const ContactOrb3D = lazy3D(
  () => import("../sections/ContactOrb3D.jsx"),
  "ContactOrb3D",
  "contact-3d",
  { defer: true }
);
