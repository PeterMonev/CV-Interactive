import { GraduationCap } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { EDUCATION } from "../../data/education.js";

export function Education() {
  return (
    <section id="education" className="section">
      <Reveal>
        <p className="section-eyebrow">
          <GraduationCap size={14} /> Education
        </p>
        <ScrambleHeading text="Still compiling knowledge." className="h2" />
      </Reveal>

      <div className="edu-grid">
        {EDUCATION.map((ed, i) => (
          <Reveal delay={i * 90} key={ed.title}>
            <div className="edu-card">
              <span className="edu-period">{ed.period}</span>
              <h3 className="edu-title">{ed.title}</h3>
              <p className="edu-school">{ed.school}</p>
              {ed.tags.length > 0 && (
                <div className="chip-row">
                  {ed.tags.map((t) => (
                    <span className="chip chip-mono" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
