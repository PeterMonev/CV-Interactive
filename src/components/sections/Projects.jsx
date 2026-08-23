import { useState } from "react";
import { Database } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { ProjectFlipCard } from "./ProjectFlipCard.jsx";
import { CaseStudy } from "./CaseStudy.jsx";
import { PROJECTS, FILTERS } from "../../data/projects.js";
import { useLang } from "../../i18n/index.jsx";

export function Projects() {
  const [projectFilter, setProjectFilter] = useState("all");
  const { t } = useLang();

  const activeFilter = FILTERS.find((f) => f.id === projectFilter) || FILTERS[0];
  const filteredProjects = PROJECTS.filter(activeFilter.test);

  return (
    <section id="projects" className="section">
      <Reveal>
        <p className="section-eyebrow">
          <Database size={14} /> {t("projects.eyebrow")}
        </p>
        <ScrambleHeading text={t("projects.heading")} className="h2" />
      </Reveal>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`filter-btn ${projectFilter === f.id ? "filter-btn-active" : ""}`}
            onClick={() => setProjectFilter(f.id)}
          >
            {t(`projects.filters.${f.labelKey}`)}
          </button>
        ))}
      </div>

      <p className="filter-hint">{t("projects.flipHint")}</p>

      <div className="flip-grid" key={projectFilter}>
        {filteredProjects.map((p, i) => (
          <Reveal delay={i * 90} key={p.name} className="">
            <ProjectFlipCard project={p} index={i} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <CaseStudy />
      </Reveal>
    </section>
  );
}
