import { GraduationCap, Building2 } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { EDUCATION } from "../../data/education.js";
import { useLang, useTx } from "../../i18n/index.jsx";

// One accent per entry, cycling the site palette. Four identical cards read as
// a table of contents; four that each carry a colour read as a set.
const EDU_ACCENTS = ["#00e5ff", "#8b5cf6", "#ff3ec9", "#5eead4"];

export function Education() {
  const { t } = useLang();
  const tx = useTx();

  return (
    <section id="education" className="section">
      <Reveal variant="wipe">
        <p className="section-eyebrow">
          <GraduationCap size={14} /> {t("education.eyebrow")}
        </p>
        <ScrambleHeading text={t("education.heading")} className="h2" />
      </Reveal>

      <div className="edu-grid">
        {EDUCATION.map((ed, i) => (
          <Reveal delay={i * 90} key={i}>
            <div
              className="edu-card"
              style={{ "--accent": EDU_ACCENTS[i % EDU_ACCENTS.length] }}
            >
              <div className="edu-card-top">
                <span className="edu-index">{String(i + 1).padStart(2, "0")}</span>
                <span className="edu-period">{tx(ed.period)}</span>
              </div>
              <h3 className="edu-title">{tx(ed.title)}</h3>
              <p className="edu-school">
                <Building2 size={13} /> {tx(ed.school)}
              </p>
              {ed.tags.length > 0 && (
                <>
                  <div className="edu-rule" />
                  <div className="chip-row">
                    {ed.tags.map((t) => (
                      <span className="chip chip-mono" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
