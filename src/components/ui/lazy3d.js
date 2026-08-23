import { lazy, Suspense, createElement } from "react";

// Every WebGL scene sits behind React.lazy so three.js — roughly half the
// shipped JavaScript — never lands in the initial bundle. The nav, the hero
// copy and the CV button paint while the three chunk is still in flight, then
// each canvas swaps itself in. The fallback renders the same element the real
// component would, so it reserves the identical box and nothing shifts.
function lazy3D(loader, exportName, className) {
  const Component = lazy(() =>
    loader().then((mod) => ({ default: mod[exportName] }))
  );
  const fallback = className
    ? createElement("div", { className, "aria-hidden": "true" })
    : null;
  return function Lazy3DBoundary(props) {
    return createElement(Suspense, { fallback }, createElement(Component, props));
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
  "stats-3d"
);
export const Timeline3D = lazy3D(
  () => import("../sections/Timeline3D.jsx"),
  "Timeline3D",
  "timeline-3d"
);
export const CertificateCloud3D = lazy3D(
  () => import("../sections/CertificateCloud3D.jsx"),
  "CertificateCloud3D",
  "cert-3d"
);
export const SkillsGalaxy3D = lazy3D(
  () => import("../sections/SkillsGalaxy3D.jsx"),
  "SkillsGalaxy3D",
  "galaxy-3d"
);
export const HologramViewer = lazy3D(
  () => import("../sections/HologramViewer.jsx"),
  "HologramViewer",
  "hologram-viewer"
);
export const ContactOrb3D = lazy3D(
  () => import("../sections/ContactOrb3D.jsx"),
  "ContactOrb3D",
  "contact-3d"
);
