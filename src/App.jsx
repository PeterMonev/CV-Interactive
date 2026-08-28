import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { Analytics } from "@vercel/analytics/react";
import { LanguageProvider, useLang } from "./i18n/index.jsx";
import "./styles/global.css";

import { prefersReducedMotion } from "./utils/motion.js";
import { NAV_LINKS } from "./data/nav.js";

import { BootLoader } from "./components/chrome/BootLoader.jsx";
import {
  ScrollStarfield,
  Cursor3D,
  ScrollToTopButton,
} from "./components/ui/lazy3d.js";
import { CursorSpotlight } from "./components/chrome/CursorSpotlight.jsx";
import { Nav } from "./components/chrome/Nav.jsx";
import { CommandPalette } from "./components/chrome/CommandPalette.jsx";
import { PrintCV } from "./components/chrome/PrintCV.jsx";
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
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}

function AppShell() {
  const { t } = useLang();
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
      {/* First stop in the tab order, and the only one a mouse never sees.
          The target takes tabindex -1 so focus actually moves with the
          scroll: without it the browser scrolls and leaves focus at the top,
          and the next Tab drops you back into the navigation you just
          skipped. */}
      <a
        className="skip-link"
        href="#home"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById("home");
          if (!el) return;
          el.setAttribute("tabindex", "-1");
          el.focus({ preventScroll: true });
          scrollTo("home");
        }}
      >
        {t("nav.skip")}
      </a>

      {!booted && <BootLoader onDone={() => setBooted(true)} />}

      {/* The bar already knows how far down the page you are; naming the section
          lets it also say which one, in the colour that section uses elsewhere. */}
      <div
        className="progress-bar"
        data-section={active}
        style={{ width: `${progress}%` }}
      />

      <ScrollStarfield />
      <div className="orb orb-a" aria-hidden="true" />
      <div className="orb orb-b" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <CursorSpotlight />
      <Cursor3D />
      <ScrollToTopButton />
      <CommandPalette scrollTo={scrollTo} />
      <PrintCV />

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
      <Analytics />
    </div>
  );
}
