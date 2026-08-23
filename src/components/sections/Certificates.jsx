import { useState } from "react";
import { Award, BadgeCheck, ExternalLink } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { CertificateCloud3D } from "./CertificateCloud3D.jsx";
import {
  CERT_DATA,
  CERT_FALLBACK_URL,
  CERT_PALETTE,
} from "../../data/certificates.js";

// The 3D cloud paints every badge name into a canvas texture, so those names
// exist as pixels and nothing else — invisible to Ctrl+F, to screen readers and
// to crawlers. The grid view is the real, linkable version of the same list;
// while the cloud is showing, CertificateList doubles as the canvas's text
// alternative behind .sr-only so the credentials are never unreachable.
function CertificateList({ srOnly = false }) {
  return (
    <ul className={srOnly ? "sr-only" : "cert-grid"}>
      {CERT_DATA.map((cert, i) => {
        const accent = CERT_PALETTE[i % CERT_PALETTE.length];
        return (
          <li key={cert.name}>
            <a
              className={srOnly ? undefined : "cert-card"}
              href={cert.url || CERT_FALLBACK_URL}
              target="_blank"
              rel="noreferrer"
              style={srOnly ? undefined : { "--cert-accent": accent }}
            >
              {!srOnly && <BadgeCheck size={18} className="cert-card-icon" />}
              <span className="cert-card-name">{cert.name}</span>
              {!srOnly && (
                <span className="cert-card-link">
                  SoftUni · view credential <ExternalLink size={12} />
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
  const [certView, setCertView] = useState("3d");

  return (
    <section id="certificates" className="section">
      <Reveal>
        <p className="section-eyebrow">
          <Award size={14} /> Certificates
        </p>
        <ScrambleHeading text="Sixteen credentials, one orbit." className="h2" />
        <p className="lead">
          {certView === "3d"
            ? "Drag to spin the cluster, click or tap a badge to open its SoftUni credential."
            : "Every credential, verifiable at the source — each card links to its SoftUni page."}
        </p>
      </Reveal>

      <div className="filter-row">
        <button
          className={`filter-btn ${certView === "3d" ? "filter-btn-active" : ""}`}
          onClick={() => setCertView("3d")}
        >
          3D Orbit
        </button>
        <button
          className={`filter-btn ${certView === "list" ? "filter-btn-active" : ""}`}
          onClick={() => setCertView("list")}
        >
          List
        </button>
      </div>

      <Reveal delay={80}>
        {certView === "3d" ? (
          <>
            <div className="cert-cloud-wrap">
              <CertificateCloud3D certs={CERT_DATA} />
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
