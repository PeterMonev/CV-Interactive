import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./motion.js";

gsap.registerPlugin(ScrollTrigger);

// Scroll choreography.
//
// The site had one entrance — fade up, fifty-seven times — which reads as a
// template no matter how good the individual sections are. These helpers give
// the page a few distinct movements instead: things that track the scroll
// position continuously (parallax), things that arrive with weight (masked
// headings), and things that arrive as a group (staggered cards).
//
// Everything here is transform and opacity only. Nothing changes layout, so a
// mistake can look wrong but cannot push the page around or clip content.

export const scrollFxEnabled = () => !prefersReducedMotion();

// Ties a value to scroll position rather than firing once. The element keeps
// moving the whole time it crosses the viewport, which is what separates a
// choreographed page from a list of fade-ins.
export function parallax(el, { from = 0, to = -80, start = "top bottom", end = "bottom top" } = {}) {
  if (!el || !scrollFxEnabled()) return null;
  return gsap.fromTo(
    el,
    { y: from },
    {
      y: to,
      ease: "none",
      scrollTrigger: { trigger: el.parentElement || el, start, end, scrub: 0.6 },
    }
  );
}

// A heading that rises out from behind its own edge. The clip is on a wrapper,
// so the text itself never moves relative to the layout — it is revealed, not
// pushed, which is why it reads as deliberate rather than as a transition.
export function revealMasked(el, { delay = 0 } = {}) {
  if (!el || !scrollFxEnabled()) return null;
  const parent = el.parentElement;
  if (parent) parent.style.overflow = "hidden";
  return gsap.fromTo(
    el,
    { yPercent: 110, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: 0.9,
      delay,
      ease: "power3.out",
      scrollTrigger: { trigger: parent || el, start: "top 88%", once: true },
    }
  );
}

// Cards arriving as a group rather than each on its own timer. The slight
// rotation is what stops a stagger looking mechanical.
export function staggerIn(els, { y = 42, stagger = 0.08, rotate = 1.5 } = {}) {
  const list = Array.from(els || []);
  if (!list.length || !scrollFxEnabled()) return null;
  return gsap.fromTo(
    list,
    { y, opacity: 0, rotateX: rotate * 4, transformOrigin: "50% 0%" },
    {
      y: 0,
      opacity: 1,
      rotateX: 0,
      duration: 0.75,
      stagger,
      ease: "power3.out",
      scrollTrigger: { trigger: list[0].parentElement || list[0], start: "top 85%", once: true },
    }
  );
}

// Counts while the number is on its way in, so the figure arrives having been
// earned rather than simply appearing.
export function countTo(el, value, { suffix = "" } = {}) {
  if (!el || !scrollFxEnabled()) return null;
  const state = { n: 0 };
  return gsap.to(state, {
    n: value,
    duration: 1.4,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = Math.round(state.n) + suffix;
    },
    scrollTrigger: { trigger: el, start: "top 90%", once: true },
  });
}

// ScrollTrigger caches page geometry. Anything that changes height after the
// fact — a lazily mounted 3D scene, a language switch, an expanding panel —
// leaves every trigger below it pointing at the wrong place until this runs.
export function refreshScrollFx() {
  if (scrollFxEnabled()) ScrollTrigger.refresh();
}

export { gsap, ScrollTrigger };
