import { useState } from "react";
import { ChevronDown, Github, ArrowUpRight, FlaskConical } from "lucide-react";
import { CASE_STUDY } from "../../data/caseStudy.js";
import { track, EVENTS } from "../../utils/analytics.js";
import { useLang, useTx } from "../../i18n/index.jsx";

// The dependency arrow points one way — each layer knows only the one beneath
// it, and the bottom knows nothing at all. Drawn rather than described because
// the direction is the whole point.
//
// Takes the study rather than reaching for a module-level constant: there are
// two of these now, and the second exists precisely because one worked example
// of how a thing is put together is a claim, and two is a habit.
function ArchitectureDiagram({ study }) {
  const tx = useTx();

  return (
    <div className="cs-arch">
      <div className="cs-arch-core">
        {study.layers.map((l, i) => (
          <div className="cs-layer-row" key={l.name}>
            <div className="cs-layer" style={{ "--layer-accent": l.accent }}>
              <div className="cs-layer-head">
                <code className="cs-layer-name">{l.name}</code>
                <span className="cs-layer-role">{tx(l.role)}</span>
              </div>
              <p className="cs-layer-detail">{tx(l.detail)}</p>
            </div>
            {i < study.layers.length - 1 && (
              <span className="cs-arrow" aria-hidden="true">
                <ChevronDown size={16} />
              </span>
            )}
          </div>
        ))}
        <p className="cs-arch-caption">{tx(study.archCaption)}</p>
      </div>
      <div className="cs-arch-side">
        {study.sideProjects.map((s) => (
          <div className="cs-side" key={s.name}>
            <code className="cs-side-name">{s.name}</code>
            <span className="cs-side-detail">{tx(s.detail)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseStudy({ study = CASE_STUDY }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const tx = useTx();
  const panelId = `case-study-${study.project.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={`cs-wrap ${open ? "cs-open" : ""}`}>
      <button
        className="cs-toggle"
        onClick={() =>
          setOpen((o) => {
            if (!o) track(EVENTS.CASE_STUDY_OPEN, { project: study.project });
            return !o;
          })
        }
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="cs-toggle-label">{tx(study.toggle)}</span>
        <span className="cs-toggle-sub">{tx(study.tagline)}</span>
        <ChevronDown size={18} className="cs-chevron" />
      </button>

      {open && (
        <div className="cs-panel" id={panelId}>
          <p className="cs-problem">{tx(study.problem)}</p>

          <ArchitectureDiagram study={study} />

          <div className="cs-decisions">
            {study.decisions.map((d, i) => (
              <div className="cs-decision" key={i}>
                <h4 className="cs-decision-title">{tx(d.title)}</h4>
                <p className="cs-decision-body">{tx(d.body)}</p>
              </div>
            ))}
          </div>

          <div className="cs-tests">
            <p className="cs-tests-head">
              <FlaskConical size={15} /> {t("caseStudy.tests")}
            </p>
            <div className="chip-row">
              {study.testing.stack.map((item) => (
                <span className="chip chip-mono chip-sm" key={item}>
                  {item}
                </span>
              ))}
            </div>
            <p className="cs-decision-body">{tx(study.testing.detail)}</p>
          </div>

          <div className="cs-next">
            <h4 className="cs-decision-title">{t("caseStudy.whatIdChange")}</h4>
            <p className="cs-decision-body">{tx(study.nextTime)}</p>
          </div>

          <div className="cs-links">
            <a className="btn btn-ghost" href={study.repo} target="_blank" rel="noreferrer">
              <Github size={16} /> {t("caseStudy.readSource")}
            </a>
            <a className="btn btn-ghost" href={study.live} target="_blank" rel="noreferrer">
              {t("caseStudy.openLive")} <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
