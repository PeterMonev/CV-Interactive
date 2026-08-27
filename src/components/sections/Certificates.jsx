import { useState } from "react";
import { Award, BadgeCheck, ExternalLink } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { CertificateCloud3D } from "../ui/lazy3d.js";
import {
  CERT_DATA,
  CERT_FALLBACK_URL,
  CERT_PALETTE,
} from "../../data/certificates.js";
import { track, EVENTS } from "../../utils/analytics.js";
import { useLang } from "../../i18n/index.jsx";
import { useParallax } from "../../hooks/useScrollFx.js";

// The 3D cloud paints every badge name into a canvas texture, so those names
// exist as pixels and nothing else — invisible to Ctrl+F, to screen readers and
// to crawlers. The grid view is the real, linkable version of the same list;
// while the cloud is showing, CertificateList doubles as the canvas's text
// alternative behind .sr-only so the credentials are never unreachable.
function CertificateList({ srOnly = false }) {
  const { t } = useLang();

  return (
    <ul className={srOnly ? "sr-only" : "cert-grid"}>
      {CERT_DATA.map((cert, i) => {
        const accent = CERT_PALETTE[i % CERT_PALETTE.length];
        return (
          // the accent sits on the item, not the link, so the halo behind it can
          // read the same variable the card does
          <li key={cert.name} style={srOnly ? undefined : { "--cert-accent": accent }}>
            <a
              className={srOnly ? undefined : "cert-card"}
              href={cert.url || CERT_FALLBACK_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => track(EVENTS.CERT_OPEN, { name: cert.name, view: "list" })}
            >
              {!srOnly && <BadgeCheck size={18} className="cert-card-icon" />}
              <span className="cert-card-name">{cert.name}</span>
              {!srOnly && (
                <span className="cert-card-link">
                  {t("certificates.viewCredential")} <ExternalLink size={12} />
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function Certificates() {
  // The orbit opens by default on a screen with room for it, the list on one
  // without. Measured on a 402px phone: the cluster is 11.5 units wide against
  // a 307px box, so the camera pulls back to 15 and each badge lands 47 pixels
  // across — about six pixels of letter height. Sixteen credentials cannot be
  // read at that size no matter how they are lit, and the list view is the
  // form that was built for it. The toggle still offers the orbit.
  const [certView, setCertView] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 700 ? "list" : "3d"
  );
  const { t } = useLang();
  const cloudRef = useParallax({ from: 46, to: -46 });

  return (
    <section id="certificates" className="section">
      <Reveal variant="wipe">
        <p className="section-eyebrow">
          <Award size={14} /> {t("certificates.eyebrow")}
        </p>
        <ScrambleHeading text={t("certificates.heading")} className="h2" />
        <p className="lead">
          {certView === "3d" ? t("certificates.lead3d") : t("certificates.leadList")}
        </p>
      </Reveal>

      <div className="filter-row">
        <button
          className={`filter-btn ${certView === "3d" ? "filter-btn-active" : ""}`}
          onClick={() => setCertView("3d")}
        >
          {t("certificates.view3d")}
        </button>
        <button
          className={`filter-btn ${certView === "list" ? "filter-btn-active" : ""}`}
          onClick={() => setCertView("list")}
        >
          {t("certificates.viewList")}
        </button>
      </div>

      <Reveal delay={80} variant="scale">
        {certView === "3d" ? (
          <>
            <div className="cert-cloud-wrap">
              <div ref={cloudRef} className="fx-layer">
                <CertificateCloud3D certs={CERT_DATA} />
              </div>
            </div>
            <CertificateList srOnly />
          </>
        ) : (
          <CertificateList />
        )}
      </Reveal>
    </section>
  );
}
