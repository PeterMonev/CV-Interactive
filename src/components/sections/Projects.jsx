import { useState } from "react";
import { Database } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { ProjectFlipCard } from "./ProjectFlipCard.jsx";
import { PROJECTS, FILTERS } from "../../data/projects.js";

export function Projects() {
  const [projectFilter, setProjectFilter] = useState("all");

  const activeFilter = FILTERS.find((f) => f.id === projectFilter) || FILTERS[0];
  const filteredProjects = PROJECTS.filter(activeFilter.test);

  return (
    <section id="projects" className="section">
      <Reveal>
        <p className="section-eyebrow">
          <Database size={14} /> Projects
        </p>
        <ScrambleHeading text="Things I built end to end." className="h2" />
      </Reveal>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`filter-btn ${projectFilter === f.id ? "filter-btn-active" : ""}`}
            onClick={() => setProjectFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="filter-hint">Hover or tap a card to flip it.</p>

      <div className="flip-grid" key={projectFilter}>
        {filteredProjects.map((p, i) => (
          <Reveal delay={i * 90} key={p.name} className="">
            <ProjectFlipCard project={p} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
