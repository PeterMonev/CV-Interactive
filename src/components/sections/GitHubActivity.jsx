import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { fetchActivity, relativeTime, ACTIVITY_DAYS } from "../../utils/github.js";
import { useLang } from "../../i18n/index.jsx";

// Answers the one question a recruiter has about a junior that a CV cannot:
// is this person writing code right now. If GitHub is unreachable or the hourly
// limit is spent, the block renders nothing at all — an empty space beats a
// broken panel on a page whose whole job is to make an impression.
//
// The window is 30 days because that is what the data supports: the public
// events feed holds 27 events here, spanning 27 days, with no further pages.
// A 90-day strip would be two thirds empty and look worse for showing less.
export function GitHubActivity() {
  const [data, setData] = useState(null);
  const [grown, setGrown] = useState(false);
  const { t, lang } = useLang();

  useEffect(() => {
    let alive = true;
    fetchActivity()
      .then((d) => {
        if (!alive) return;
        setData(d);
        // one frame later, so the bars animate up from nothing
        requestAnimationFrame(() => alive && setGrown(true));
        setTimeout(() => alive && setGrown(true), 80);
      })
      .catch(() => {
        /* rate limited or offline — stay hidden */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!data || !data.pushes) return null;

  const busiest = data.days.reduce((m, d) => Math.max(m, d.pushes), 0);

  return (
    <div className="gh">
      <div className="gh-top">
        <a
          className="gh-head"
          href="https://github.com/PeterMonev"
          target="_blank"
          rel="noreferrer"
        >
          <Github size={15} />
          <span>{t("github.title")}</span>
        </a>
        {data.lastPush && (
          <span className="gh-live">
            <span className="dot-live" />
            {t("github.last")} {relativeTime(data.lastPush, lang)}
          </span>
        )}
      </div>

      <div className="gh-body">
        <div className="gh-count">
          <span className="gh-count-num">{data.pushes}</span>
          <span className="gh-count-label">
            {t("github.pushes")}
            <br />
            {t("github.inDays").replace("{n}", ACTIVITY_DAYS)}
          </span>
        </div>

        <div className="gh-chart">
          <div
            className={`gh-strip ${grown ? "gh-strip-grown" : ""}`}
            role="img"
            aria-label={`${data.pushes} ${t("github.pushes")}`}
          >
            {data.days.map((d, i) => (
              <span
                key={d.date}
                className={`gh-bar ${d.pushes ? "gh-bar-on" : ""}`}
                style={{
                  // height carries the count, hue carries the position, so the
                  // strip reads left-to-right as well as tall-to-short
                  "--h": d.pushes ? `${28 + (d.pushes / busiest) * 72}%` : "10%",
                  "--t": i / (data.days.length - 1),
                  "--delay": `${i * 16}ms`,
                }}
                title={`${d.date} · ${d.pushes}`}
              />
            ))}
          </div>
          <div className="gh-axis">
            <span>{t("github.daysAgo").replace("{n}", ACTIVITY_DAYS)}</span>
            <span>{t("github.today")}</span>
          </div>
        </div>
      </div>

      {data.repos.length > 0 && (
        <div className="gh-repos">
          <span className="gh-repos-label">{t("github.recently")}</span>
          {data.repos.map((r) => (
            <a
              key={r}
              className="chip chip-mono chip-sm"
              href={`https://github.com/PeterMonev/${r}`}
              target="_blank"
              rel="noreferrer"
            >
              {r}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
