import { Briefcase } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { Timeline3D } from "../ui/lazy3d.js";
import { EXPERIENCE } from "../../data/experience.js";
import { useLang, useTx } from "../../i18n/index.jsx";
import { useParallax } from "../../hooks/useScrollFx.js";

export function Experience() {
  const { t } = useLang();
  const tx = useTx();
  // the filament runs against the cards rather than with them
  // Small on purpose: the filament now marks where the reader is, so a wide
  // parallax would slide the lit node away from the card it belongs to.
  const filamentRef = useParallax({ from: -10, to: 10 });

  return (
    <section id="experience" className="section">
      <Reveal>
        <p className="section-eyebrow">
          <Briefcase size={14} /> {t("experience.eyebrow")}
        </p>
        <ScrambleHeading text={t("experience.heading")} className="h2" />
      </Reveal>

      <div className="timeline">
        <div ref={filamentRef} className="fx-layer timeline-fx">
          <Timeline3D count={EXPERIENCE.length} />
        </div>
        {EXPERIENCE.map((job, i) => (
          <Reveal delay={i * 100} key={job.company} className="timeline-item">
            <div className="timeline-card">
              <div className="timeline-head">
                <div>
                  <h3 className="timeline-role">{tx(job.role)}</h3>
                  <p className="timeline-company">
                    {tx(job.company)} · {tx(job.location)}
                  </p>
                </div>
                <span className="timeline-period">{tx(job.period)}</span>
              </div>
              <ul className="timeline-bullets">
                {job.bullets.map((b, bi) => (
                  <li key={bi}>{tx(b)}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
