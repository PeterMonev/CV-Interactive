import { useState } from "react";
import { Layers, ArrowUpRight } from "lucide-react";
import { magneticMove, magneticLeave } from "../../utils/motion.js";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { HologramViewer } from "../ui/lazy3d.js";
import { PROJECTS } from "../../data/projects.js";

export function Hologram() {
  const [hologramIndex, setHologramIndex] = useState(0);

  return (
    <section id="hologram" className="section">
      <Reveal>
        <p className="section-eyebrow">
          <Layers size={14} /> Hologram Lab
        </p>
        <ScrambleHeading text="Same projects, beamed in 3D." className="h2" />
        <p className="lead">
          Pick a project — it gets projected as a rotating hologram. Drag it
          to spin, real screenshots included.
        </p>
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
                      <HologramViewer projects={PROJECTS} activeIndex={hologramIndex} />
        </div>
        <div className="hologram-info">
          <h3>{PROJECTS[hologramIndex].name}</h3>
          <p>{PROJECTS[hologramIndex].description}</p>
          <a
            className="btn btn-primary"
            href={PROJECTS[hologramIndex].live}
            target="_blank"
            rel="noreferrer"
            onMouseMove={magneticMove}
            onMouseLeave={magneticLeave}
          >
            View live <ArrowUpRight size={16} />
          </a>
        </div>
      </Reveal>
    </section>
  );
}
