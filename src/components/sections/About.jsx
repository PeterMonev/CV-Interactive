import { handleCardMove, handleCardLeave } from "../../utils/motion.js";
import { Reveal } from "../ui/Reveal.jsx";
import { CountUp } from "../ui/CountUp.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { MatrixRain } from "../chrome/MatrixRain.jsx";
import { StatsField3D } from "../ui/lazy3d.js";
import { PHOTO_SRC } from "../../data/photo.js";
import { STATS_3D_DATA } from "../../data/stats3d.js";
import { useLang } from "../../i18n/index.jsx";
import { useParallax } from "../../hooks/useScrollFx.js";

export function About() {
  const { t } = useLang();
  const statsFieldRef = useParallax({ from: 40, to: -40 });

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
              <span className="dot-live" /> {t("about.available")}
            </span>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="section-eyebrow">{t("about.eyebrow")}</p>
            <ScrambleHeading text={t("about.heading")} className="h2" />
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">{t("about.lead")}</p>
          </Reveal>

          <div className="stats">
            {[
              { to: 4, label: t("about.stats.projects") },
              { to: 3, label: t("about.stats.languages") },
              { to: 5, label: t("about.stats.databases") },
              { to: 16, label: t("about.stats.certificates") },
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
            <div ref={statsFieldRef} className="fx-layer stats-fx">
              <StatsField3D stats={STATS_3D_DATA} />
            </div>
        </div>
      </Reveal>
    </section>
  );
}
