import { Briefcase } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { Timeline3D } from "../ui/lazy3d.js";
import { EXPERIENCE } from "../../data/experience.js";

export function Experience() {
  return (
    <section id="experience" className="section">
      <Reveal>
        <p className="section-eyebrow">
          <Briefcase size={14} /> Work Experience
        </p>
        <ScrambleHeading text="Where the code met customers." className="h2" />
      </Reveal>

      <div className="timeline">
                  <Timeline3D count={EXPERIENCE.length} />
        {EXPERIENCE.map((job, i) => (
          <Reveal delay={i * 100} key={job.role} className="timeline-item">
            <div className="timeline-card">
              <div className="timeline-head">
                <div>
                  <h3 className="timeline-role">{job.role}</h3>
                  <p className="timeline-company">
                    {job.company} · {job.location}
                  </p>
                </div>
                <span className="timeline-period">{job.period}</span>
              </div>
              <ul className="timeline-bullets">
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
