import { useState, useCallback } from "react";
import { Mail, Linkedin, Github, MapPin, Music2, FileDown } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { Equalizer } from "../ui/Equalizer.jsx";
import { ContactOrb3D } from "../ui/lazy3d.js";
import { ContactCopyCard } from "./ContactCopyCard.jsx";
import { PhoneRevealCard } from "./PhoneRevealCard.jsx";
import { CV_URL, CV_FILENAME } from "../../data/cv.js";
import { track, EVENTS } from "../../utils/analytics.js";
import { ContactForm } from "./ContactForm.jsx";
import { useLang } from "../../i18n/index.jsx";

export function Contact() {
  const [copied, setCopied] = useState(null);
  const { t } = useLang();

  const copyToClipboard = useCallback((text, field) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(field);
    setTimeout(() => setCopied((c) => (c === field ? null : c)), 1600);
  }, []);

  return (
    <section id="contact" className="section contact">
      <ContactOrb3D />
      <div className="contact-fg">
        <Equalizer bars={40} className="eq-divider" />
        <Reveal>
          <p className="section-eyebrow">
            <Music2 size={14} /> {t("contact.eyebrow")}
          </p>
          <ScrambleHeading text={t("contact.heading")} className="h2" />
          <p className="lead">{t("contact.lead")}</p>
        </Reveal>

        <Reveal delay={100}>
          <div className="contact-grid">
            <ContactCopyCard
              icon={<Mail size={18} />}
              label={t("contact.email")}
              value="monevpeter@gmail.com"
              copyValue="monevpeter@gmail.com"
              fieldKey="email"
              actionHref="mailto:monevpeter@gmail.com"
              actionLabel={t("contact.openMail")}
              copied={copied === "email"}
              onCopy={copyToClipboard}
            />
            <PhoneRevealCard />
            <a
              className="contact-card"
              href="https://www.linkedin.com/in/peter-monev-22582b248/"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin size={18} />
              <div className="contact-body">
                <span className="contact-label">LinkedIn</span>
                <span className="contact-value">peter-monev</span>
              </div>
            </a>
            <a
              className="contact-card"
              href="https://github.com/PeterMonev"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={18} />
              <div className="contact-body">
                <span className="contact-label">GitHub</span>
                <span className="contact-value">PeterMonev</span>
              </div>
            </a>
            <a
              className="contact-card contact-card-cv"
              href={CV_URL}
              download={CV_FILENAME}
              onClick={() => track(EVENTS.CV_DOWNLOAD, { from: "contact" })}
            >
              <FileDown size={18} />
              <div className="contact-body">
                <span className="contact-label">{t("contact.resume")}</span>
                <span className="contact-value">{t("contact.resumeValue")}</span>
              </div>
            </a>
            <div className="contact-card contact-static">
              <MapPin size={18} />
              <div className="contact-body">
                <span className="contact-label">{t("contact.basedIn")}</span>
                <span className="contact-value">{t("contact.basedInValue")}</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
