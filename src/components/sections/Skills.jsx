import { useState } from "react";
import { Code2 } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { SkillsGalaxy3D } from "../ui/lazy3d.js";
import { SKILLS } from "../../data/skills.js";

export function Skills() {
  const [skillsView, setSkillsView] = useState("3d");
  const [selectedDomain, setSelectedDomain] = useState(null);

  return (
    <section id="skills" className="section">
      <Reveal>
        <p className="section-eyebrow">
          <Code2 size={14} /> Tech Skills
        </p>
        <ScrambleHeading text="The stack, honestly labeled." className="h2" />
      </Reveal>

      <div className="filter-row">
        <button
          className={`filter-btn ${skillsView === "chips" ? "filter-btn-active" : ""}`}
          onClick={() => setSkillsView("chips")}
        >
          Chips
        </button>
        <button
          className={`filter-btn ${skillsView === "3d" ? "filter-btn-active" : ""}`}
          onClick={() => setSkillsView("3d")}
        >
          3D Galaxy
        </button>
      </div>

      {skillsView === "chips" ? (
        <div className="skills-grid">
          {SKILLS.map((group, i) => (
            <Reveal delay={i * 70} key={group.group}>
              <div className="skill-card">
                <h3 className="skill-group">{group.group}</h3>
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
                          <SkillsGalaxy3D onSelect={(domain) => setSelectedDomain(domain)} />
            <div className="galaxy-info">
              {selectedDomain ? (
                <>
                  <p className="galaxy-info-title">{selectedDomain.category}</p>
                  <div className="chip-row">
                    {selectedDomain.items.map((item) => (
                      <span className="chip chip-mono" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="galaxy-info-hint">
                  Backend and languages carry real weight here — Laravel,
                  ASP.NET Core, Node.js and Express orbit as "Backend",
                  separate from the frontend-facing tools. Drag to rotate
                  the system, click or tap a sphere to see what's inside
                  it.
                </p>
              )}
            </div>
          </div>
        </Reveal>
      )}
    </section>
  );
}
