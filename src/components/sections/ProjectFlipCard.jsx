import { useState, useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { projectIcon } from "../../utils/projectIcon.js";
import { magneticMove, magneticLeave } from "../../utils/motion.js";
import { useLang, useTx } from "../../i18n/index.jsx";

const PROJECT_TINTS = [
  ["rgba(0,229,255,0.2)", "rgba(139,92,246,0.14)"],
  ["rgba(255,62,201,0.18)", "rgba(0,229,255,0.12)"],
  ["rgba(94,234,212,0.18)", "rgba(139,92,246,0.12)"],
  ["rgba(139,92,246,0.18)", "rgba(255,62,201,0.12)"],
];

// The colour the card glows in when you reach it. Stronger than the wash
// behind the artwork, and the same hue, so the two read as one card.
const PROJECT_EDGES = [
  "rgba(0,229,255,0.55)",
  "rgba(255,62,201,0.5)",
  "rgba(94,234,212,0.5)",
  "rgba(139,92,246,0.5)",
];


export function ProjectFlipCard({ project, index }) {
  const [flipped, setFlipped] = useState(false);
  const { t } = useLang();
  const tx = useTx();
  const finePointerRef = useRef(true);
  const Icon = projectIcon(project.name);
  const [tint1, tint2] = PROJECT_TINTS[index % PROJECT_TINTS.length];
  const edge = PROJECT_EDGES[index % PROJECT_EDGES.length];

  useEffect(() => {
    finePointerRef.current =
      !!window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  // Desktop (fine pointer): hover alone controls the flip, click does nothing.
  // Touch (coarse pointer): tap alone controls it, hover events are ignored.
  // Keeping these two modes mutually exclusive is what avoids the flip
  // getting stuck or ignoring input, which happened when both could fire.
  function handleClick() {
    if (!finePointerRef.current) setFlipped((f) => !f);
  }
  function handleMouseEnter() {
    if (finePointerRef.current) setFlipped(true);
  }
  function handleMouseLeave() {
    if (finePointerRef.current) setFlipped(false);
  }

  return (
    <div
      className={`flip-card ${project.featured ? "flip-card-featured" : ""}`}
      style={{ animationDelay: `${(index % 4) * 0.4}s`, "--tint-edge": edge }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
    >
      <div className={`flip-card-inner ${flipped ? "is-flipped" : ""}`}>
        <div className="flip-card-face flip-card-front">
          <div
            className="flip-card-visual"
            style={{ "--tint1": tint1, "--tint2": tint2 }}
          >
            {project.images && project.images.length > 1 ? (
              <div className="flip-card-stack">
                {project.images.slice(0, 3).map((src, i) => (
                  <div className={`flip-card-photo flip-card-photo-${i}`} key={i}>
                    <img
                      src={src}
                      alt={`${project.name} screenshot ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            ) : project.images && project.images[0] ? (
              <div className="flip-card-stack">
                <div className="flip-card-photo flip-card-photo-single">
                  <img
                    src={project.images[0]}
                    alt={`${project.name} screenshot`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            ) : (
              <Icon size={project.featured ? 66 : 48} className="flip-card-icon" />
            )}
            <span className="flip-card-mini-icon">
              <Icon size={16} />
            </span>
            {project.featured && (
              <span className="flip-card-flagship">★ {t("projects.flagship")}</span>
            )}
          </div>
          <div className="flip-card-front-footer">
            <span className="chip chip-tag">{tx(project.tag)}</span>
            <h3 className="flip-card-name">{project.name}</h3>
          </div>
        </div>

        <div className="flip-card-face flip-card-back">
          <h3 className="flip-card-name">{project.name}</h3>
          <p className="flip-card-desc">{tx(project.description)}</p>
          <div className="chip-row">
            {project.stack.map((s) => (
              <span className="chip chip-mono chip-sm" key={s}>
                {s}
              </span>
            ))}
          </div>
          <a
            className="btn btn-primary flip-card-cta"
            href={project.live}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={magneticMove}
            onMouseLeave={magneticLeave}
          >
            {t("projects.viewLive")} <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

