import { Github, ArrowUpRight, Download } from "lucide-react";
import { magneticMove, magneticLeave } from "../../utils/motion.js";
import { CV_URL, CV_FILENAME, CV_LABEL } from "../../data/cv.js";
import { Equalizer } from "../ui/Equalizer.jsx";
import { Hero3D } from "./Hero3D.jsx";
import { HeroTerminal } from "./HeroTerminal.jsx";

export function Hero({ scrollTo }) {
  return (
    <section id="home" className="section hero">
      <Hero3D />
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="dot-live" /> Junior Full-Stack Web Developer
          </p>
          <h1 className="h1">
            Building{" "}
            <span className="grad-text">clean, working software</span> — one
            deploy at a time.
          </h1>
          <p className="hero-sub">
            Commercial experience in PHP (Laravel) and JavaScript, now
            advancing into C# and ASP.NET Core. I care about architecture
            that stays readable six months later.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => scrollTo("contact")}
              onMouseMove={magneticMove}
              onMouseLeave={magneticLeave}
            >
              Get in touch <ArrowUpRight size={16} />
            </button>
            <a
              className="btn btn-ghost"
              href={CV_URL}
              download={CV_FILENAME}
              onMouseMove={magneticMove}
              onMouseLeave={magneticLeave}
            >
              <Download size={16} /> {CV_LABEL}
            </a>
            <a
              className="btn btn-ghost"
              href="https://github.com/PeterMonev"
              target="_blank"
              rel="noreferrer"
              onMouseMove={magneticMove}
              onMouseLeave={magneticLeave}
            >
              <Github size={16} /> View GitHub
            </a>
          </div>
        </div>

        <HeroTerminal onHireMe={() => scrollTo("contact")} />
      </div>
      <span className="drag-hint">drag the shapes to spin them</span>

      <Equalizer bars={40} className="eq-divider" />
    </section>
  );
}
