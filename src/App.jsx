import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import "./styles/global.css";

import { prefersReducedMotion } from "./utils/motion.js";
import { NAV_LINKS } from "./data/nav.js";

import { BootLoader } from "./components/chrome/BootLoader.jsx";
import { ScrollStarfield } from "./components/chrome/ScrollStarfield.jsx";
import { CursorSpotlight } from "./components/chrome/CursorSpotlight.jsx";
import { Cursor3D } from "./components/chrome/Cursor3D.jsx";
import { ScrollToTopButton } from "./components/chrome/ScrollToTopButton.jsx";
import { Nav } from "./components/chrome/Nav.jsx";
import { Footer } from "./components/chrome/Footer.jsx";

import { Hero } from "./components/sections/Hero.jsx";
import { About } from "./components/sections/About.jsx";
import { Experience } from "./components/sections/Experience.jsx";
import { Education } from "./components/sections/Education.jsx";
import { Certificates } from "./components/sections/Certificates.jsx";
import { Skills } from "./components/sections/Skills.jsx";
import { Projects } from "./components/sections/Projects.jsx";
import { Hologram } from "./components/sections/Hologram.jsx";
import { Contact } from "./components/sections/Contact.jsx";

export default function App() {
  const [booted, setBooted] = useState(() => prefersReducedMotion());
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  const navLinksRef = useRef(null);
  const linkRefs = useRef({});

  useEffect(() => {
    document.body.style.overflow = booted ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [booted]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const height = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
      setProgress(height > 0 ? (scrollTop / height) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    function measure() {
      const container = navLinksRef.current;
      const el = linkRefs.current[active];
      if (container && el) {
        const cRect = container.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();
        setIndicator({
          left: eRect.left - cRect.left,
          width: eRect.width,
          opacity: 1,
        });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  }, []);

  return (
    <div className="cv-root">
      {!booted && <BootLoader onDone={() => setBooted(true)} />}

      <div className="progress-bar" style={{ width: `${progress}%` }} />

      <ScrollStarfield />
      <div className="orb orb-a" aria-hidden="true" />
      <div className="orb orb-b" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <CursorSpotlight />
      <Cursor3D />
      <ScrollToTopButton />

      <Nav
        navLinksRef={navLinksRef}
        linkRefs={linkRefs}
        active={active}
        scrollTo={scrollTo}
        indicator={indicator}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <Hero scrollTo={scrollTo} />
      <About />
      <Experience />
      <Education />
      <Certificates />
      <Skills />
      <Projects />
      <Hologram />
      <Contact />
      <Footer />
    </div>
  );
}
