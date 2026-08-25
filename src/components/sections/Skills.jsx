import { useState } from "react";
import { Code2 } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { SkillsGalaxy3D } from "../ui/lazy3d.js";
import { SKILLS } from "../../data/skills.js";
import { useLang } from "../../i18n/index.jsx";

// Same four accents the education cards use, in the same order, so the two
// list-shaped sections of the page look like they were designed together.
const SKILL_ACCENTS = ["#00e5ff", "#8b5cf6", "#ff3ec9", "#5eead4"];

export function Skills() {
  const [skillsView, setSkillsView] = useState("3d");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const { t } = useLang();
  // No parallax here. The canvas now runs to the edge of its panel, which
  // clips, so shifting it inside that frame only exposed a bare strip at one
  // end and cut the scene at the other.

  return (
    <section id="skills" className="section">
      <Reveal variant="wipe">
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
              <div
                className="skill-card"
                style={{ "--accent": SKILL_ACCENTS[i % SKILL_ACCENTS.length] }}
              >
                <div className="skill-card-top">
                  <h3 className="skill-group">{t(`skills.groups.${group.group}`)}</h3>
                  <span className="skill-count">{group.items.length}</span>
                </div>
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
            <div className="galaxy-stage">
              <SkillsGalaxy3D onSelect={(domain) => setSelectedDomain(domain)} />
            </div>
            <div className="galaxy-info">
              {selectedDomain ? (
                // The panel takes the colour of the planet that was clicked, so
                // the link between the two is carried by the design rather than
                // by the reader remembering which sphere they just touched.
                <div className="galaxy-readout" style={{ "--accent": selectedDomain.color }}>
                  <p className="galaxy-info-eyebrow">{t("skills.eyebrow")}</p>
                  <p className="galaxy-info-title">{t(`skills.groups.${selectedDomain.category}`)}</p>
                  <div className="galaxy-info-rule" />
                  <div className="chip-row">
                    {selectedDomain.items.map((item) => (
                      <span className="chip chip-mono" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="galaxy-info-count">
                    {selectedDomain.items.length} / {SKILLS.reduce((n, g) => n + g.items.length, 0)}
                  </p>
                </div>
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
