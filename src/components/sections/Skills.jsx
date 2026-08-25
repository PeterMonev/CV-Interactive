import { useState } from "react";
import { Code2 } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { SkillsGalaxy3D } from "../ui/lazy3d.js";
import { SKILLS } from "../../data/skills.js";
import { useLang } from "../../i18n/index.jsx";
import { useParallax } from "../../hooks/useScrollFx.js";

export function Skills() {
  const [skillsView, setSkillsView] = useState("3d");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const { t } = useLang();
  const galaxyRef = useParallax({ from: 44, to: -44 });

  return (
    <section id="skills" className="section">
      <Reveal variant="mask">
        <p className="section-eyebrow">
          <Code2 size={14} /> {t("skills.eyebrow")}
        </p>
        <ScrambleHeading text={t("skills.heading")} className="h2" />
      </Reveal>

      <div className="filter-row">
        <button
          className={`filter-btn ${skillsView === "chips" ? "filter-btn-active" : ""}`}
          onClick={() => setSkillsView("chips")}
        >
          {t("skills.chips")}
        </button>
        <button
          className={`filter-btn ${skillsView === "3d" ? "filter-btn-active" : ""}`}
          onClick={() => setSkillsView("3d")}
        >
          {t("skills.galaxy")}
        </button>
      </div>

      {skillsView === "chips" ? (
        <div className="skills-grid">
          {SKILLS.map((group, i) => (
            <Reveal delay={i * 70} key={group.group}>
              <div className="skill-card">
                <h3 className="skill-group">{t(`skills.groups.${group.group}`)}</h3>
                <div className="chip-row">
                  {group.items.map((item) => (
                    <span className="chip chip-mono" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal>
          <div className="galaxy-wrap">
            <div ref={galaxyRef} className="fx-layer">
              <SkillsGalaxy3D onSelect={(domain) => setSelectedDomain(domain)} />
            </div>
            <div className="galaxy-info">
              {selectedDomain ? (
                <>
                  <p className="galaxy-info-title">{t(`skills.groups.${selectedDomain.category}`)}</p>
                  <div className="chip-row">
                    {selectedDomain.items.map((item) => (
                      <span className="chip chip-mono" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="galaxy-info-hint">{t("skills.hint")}</p>
              )}
            </div>
          </div>
        </Reveal>
      )}
    </section>
  );
}
