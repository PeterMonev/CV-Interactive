import { GraduationCap } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { EDUCATION } from "../../data/education.js";
import { useLang, useTx } from "../../i18n/index.jsx";

export function Education() {
  const { t } = useLang();
  const tx = useTx();

  return (
    <section id="education" className="section">
      <Reveal>
        <p className="section-eyebrow">
          <GraduationCap size={14} /> {t("education.eyebrow")}
        </p>
        <ScrambleHeading text={t("education.heading")} className="h2" />
      </Reveal>

      <div className="edu-grid">
        {EDUCATION.map((ed, i) => (
          <Reveal delay={i * 90} key={i}>
            <div className="edu-card">
              <span className="edu-period">{tx(ed.period)}</span>
              <h3 className="edu-title">{tx(ed.title)}</h3>
              <p className="edu-school">{tx(ed.school)}</p>
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
