import { handleCardMove, handleCardLeave } from "../../utils/motion.js";
import { Reveal } from "../ui/Reveal.jsx";
import { CountUp } from "../ui/CountUp.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { MatrixRain } from "../chrome/MatrixRain.jsx";
import { StatsField3D } from "./StatsField3D.jsx";
import { PHOTO_SRC } from "../../data/photo.js";
import { STATS_3D_DATA } from "../../data/stats3d.js";

export function About() {
  return (
    <section id="about" className="section">
      <div className="about-grid">
        <Reveal>
          <div
            className="photo-frame"
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
          >
            <img src={PHOTO_SRC} alt="Peter Monev" className="photo-img" />
            <span className="photo-badge">
              <span className="dot-live" /> Available
            </span>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="section-eyebrow">About</p>
            <ScrambleHeading
              text="Frontend instincts, backend curiosity."
              className="h2"
            />
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">
              I'm a junior full-stack developer based in Sofia with
              hands-on commercial experience shipping production web
              applications. I've spent most of my time in JavaScript and
              PHP (Laravel), and I'm now deepening my C# and ASP.NET Core
              skills at Software University. I like clean architecture,
              code that's easy to hand off, and features that actually
              reach real users.
            </p>
          </Reveal>

          <div className="stats">
            {[
              { to: 4, label: "Projects shipped" },
              { to: 3, label: "Core languages" },
              { to: 5, label: "Databases used" },
              { to: 14, label: "Certificates earned" },
            ].map((s, i) => (
              <Reveal delay={i * 80} key={s.label}>
                <div className="stat">
                  <span className="stat-num">
                    <CountUp to={s.to} />+
                  </span>
                  <span className="stat-label">{s.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <Reveal delay={120}>
        <div className="stats-hologram-wrap">
          <MatrixRain />
                      <StatsField3D stats={STATS_3D_DATA} />
        </div>
      </Reveal>
    </section>
  );
}
