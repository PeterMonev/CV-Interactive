import { Award } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { CertificateCloud3D } from "./CertificateCloud3D.jsx";
import { CERT_DATA } from "../../data/certificates.js";

export function Certificates() {
  return (
    <section id="certificates" className="section">
      <Reveal>
        <p className="section-eyebrow">
          <Award size={14} /> Certificates
        </p>
        <ScrambleHeading text="Sixteen credentials, one orbit." className="h2" />
        <p className="lead">
          Drag to spin the cluster, click or tap a badge to open its
          SoftUni credential.
        </p>
      </Reveal>
      <Reveal delay={80}>
        <div className="cert-cloud-wrap">
                      <CertificateCloud3D certs={CERT_DATA} />
        </div>
      </Reveal>
    </section>
  );
}
