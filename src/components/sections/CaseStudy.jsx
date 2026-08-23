import { useState } from "react";
import { ChevronDown, Github, ArrowUpRight, FlaskConical } from "lucide-react";
import { CASE_STUDY as CS } from "../../data/caseStudy.js";
import { track, EVENTS } from "../../utils/analytics.js";

// The dependency arrow points one way — each layer knows only the one beneath
// it, and the domain at the bottom knows nothing at all. Drawn rather than
// described because the direction is the whole point.
function ArchitectureDiagram() {
  return (
    <div className="cs-arch">
      <div className="cs-arch-core">
        {CS.layers.map((l, i) => (
          <div className="cs-layer-row" key={l.name}>
            <div className="cs-layer" style={{ "--layer-accent": l.accent }}>
              <div className="cs-layer-head">
                <code className="cs-layer-name">{l.name}</code>
                <span className="cs-layer-role">{l.role}</span>
              </div>
              <p className="cs-layer-detail">{l.detail}</p>
            </div>
            {i < CS.layers.length - 1 && (
              <span className="cs-arrow" aria-hidden="true">
                <ChevronDown size={16} />
              </span>
            )}
          </div>
        ))}
        <p className="cs-arch-caption">
          depends on ↓ — the domain at the bottom references nothing
        </p>
      </div>
      <div className="cs-arch-side">
        {CS.sideProjects.map((s) => (
          <div className="cs-side" key={s.name}>
            <code className="cs-side-name">{s.name}</code>
            <span className="cs-side-detail">{s.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseStudy() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`cs-wrap ${open ? "cs-open" : ""}`}>
      <button
        className="cs-toggle"
        onClick={() =>
          setOpen((o) => {
            if (!o) track(EVENTS.CASE_STUDY_OPEN, { project: CS.project });
            return !o;
          })
        }
        aria-expanded={open}
        aria-controls="case-study-panel"
      >
        <span className="cs-toggle-label">
          How {CS.project} is put together
        </span>
        <span className="cs-toggle-sub">{CS.tagline}</span>
        <ChevronDown size={18} className="cs-chevron" />
      </button>

      {open && (
        <div className="cs-panel" id="case-study-panel">
          <p className="cs-problem">{CS.problem}</p>

          <ArchitectureDiagram />

          <div className="cs-decisions">
            {CS.decisions.map((d) => (
              <div className="cs-decision" key={d.title}>
                <h4 className="cs-decision-title">{d.title}</h4>
                <p className="cs-decision-body">{d.body}</p>
              </div>
            ))}
          </div>

          <div className="cs-tests">
            <p className="cs-tests-head">
              <FlaskConical size={15} /> Tests
            </p>
            <div className="chip-row">
              {CS.testing.stack.map((t) => (
                <span className="chip chip-mono chip-sm" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <p className="cs-decision-body">{CS.testing.detail}</p>
          </div>

          <div className="cs-next">
            <h4 className="cs-decision-title">What I would change</h4>
            <p className="cs-decision-body">{CS.nextTime}</p>
          </div>

          <div className="cs-links">
            <a className="btn btn-ghost" href={CS.repo} target="_blank" rel="noreferrer">
              <Github size={16} /> Read the source
            </a>
            <a className="btn btn-ghost" href={CS.live} target="_blank" rel="noreferrer">
              Open the live app <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
