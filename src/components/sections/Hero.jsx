import { Github, ArrowUpRight, Download } from "lucide-react";
import { magneticMove, magneticLeave } from "../../utils/motion.js";
import { CV_URL, CV_FILENAME, CV_LABEL } from "../../data/cv.js";
import { track, EVENTS } from "../../utils/analytics.js";
import { useLang } from "../../i18n/index.jsx";
import { Equalizer } from "../ui/Equalizer.jsx";
import { Hero3D } from "../ui/lazy3d.js";
import { HeroTerminal } from "./HeroTerminal.jsx";

export function Hero({ scrollTo }) {
  const { t } = useLang();

  return (
    <section id="home" className="section hero">
      <Hero3D />
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="dot-live" /> {t("hero.eyebrow")}
          </p>
          <h1 className="h1">
            {t("hero.titleLead")}{" "}
            <span className="grad-text">{t("hero.titleAccent")}</span>{" "}
            {t("hero.titleTail")}
          </h1>
          <p className="hero-sub">{t("hero.sub")}</p>
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => scrollTo("contact")}
              onMouseMove={magneticMove}
              onMouseLeave={magneticLeave}
            >
              {t("hero.cta")} <ArrowUpRight size={16} />
            </button>
            <a
              className="btn btn-ghost"
              href={CV_URL}
              download={CV_FILENAME}
              onClick={() => track(EVENTS.CV_DOWNLOAD, { from: "hero" })}
              onMouseMove={magneticMove}
              onMouseLeave={magneticLeave}
            >
              <Download size={16} /> {t("nav.cv")}
            </a>
            <a
              className="btn btn-ghost"
              href="https://github.com/PeterMonev"
              target="_blank"
              rel="noreferrer"
              onMouseMove={magneticMove}
              onMouseLeave={magneticLeave}
            >
              <Github size={16} /> {t("hero.github")}
            </a>
          </div>
        </div>

        <HeroTerminal onHireMe={() => scrollTo("contact")} scrollTo={scrollTo} />
      </div>
      <span className="drag-hint">{t("hero.dragHint")}</span>

      <Equalizer bars={40} className="eq-divider" />
    </section>
  );
}
