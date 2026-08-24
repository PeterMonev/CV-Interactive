import { useState } from "react";
import { Layers, ArrowUpRight } from "lucide-react";
import { magneticMove, magneticLeave } from "../../utils/motion.js";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { HologramViewer } from "../ui/lazy3d.js";
import { PROJECTS } from "../../data/projects.js";
import { useLang, useTx } from "../../i18n/index.jsx";
import { useParallax } from "../../hooks/useScrollFx.js";

export function Hologram() {
  const [hologramIndex, setHologramIndex] = useState(0);
  const { t } = useLang();
  const tx = useTx();
  const rigRef = useParallax({ from: 52, to: -52 });

  return (
    <section id="hologram" className="section">
      <Reveal>
        <p className="section-eyebrow">
          <Layers size={14} /> {t("hologram.eyebrow")}
        </p>
        <ScrambleHeading text={t("hologram.heading")} className="h2" />
        <p className="lead">{t("hologram.lead")}</p>
      </Reveal>

      <div className="filter-row">
        {PROJECTS.map((p, i) => (
          <button
            key={p.name}
            className={`filter-btn ${hologramIndex === i ? "filter-btn-active" : ""}`}
            onClick={() => setHologramIndex(i)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <Reveal delay={80}>
        <div className="hologram-wrap">
          <div ref={rigRef} className="fx-layer">
            <HologramViewer projects={PROJECTS} activeIndex={hologramIndex} />
          </div>
        </div>
        <div className="hologram-info">
          <h3>{PROJECTS[hologramIndex].name}</h3>
          <p>{tx(PROJECTS[hologramIndex].description)}</p>
          <a
            className="btn btn-primary"
            href={PROJECTS[hologramIndex].live}
            target="_blank"
            rel="noreferrer"
            onMouseMove={magneticMove}
            onMouseLeave={magneticLeave}
          >
            {t("projects.viewLive")} <ArrowUpRight size={16} />
          </a>
        </div>
      </Reveal>
    </section>
  );
}
