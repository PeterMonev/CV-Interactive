import { useState, useCallback } from "react";
import { Mail, Linkedin, Github, MapPin, Music2 } from "lucide-react";
import { Reveal } from "../ui/Reveal.jsx";
import { ScrambleHeading } from "../ui/ScrambleHeading.jsx";
import { Equalizer } from "../ui/Equalizer.jsx";
import { ContactOrb3D } from "./ContactOrb3D.jsx";
import { ContactCopyCard } from "./ContactCopyCard.jsx";
import { PhoneRevealCard } from "./PhoneRevealCard.jsx";

export function Contact() {
  const [copied, setCopied] = useState(null);

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
            <Music2 size={14} /> Let's talk
          </p>
          <ScrambleHeading text="Open to junior full-stack roles." className="h2" />
          <p className="lead">
            Sofia-based, comfortable remote. If there's a team that needs
            someone who ships, learns fast, and sweats the details, I'd like
            to hear from you.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="contact-grid">
            <ContactCopyCard
              icon={<Mail size={18} />}
              label="Email"
              value="monevpeter@gmail.com"
              copyValue="monevpeter@gmail.com"
              fieldKey="email"
              actionHref="mailto:monevpeter@gmail.com"
              actionLabel="Open email client"
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
            <div className="contact-card contact-static">
              <MapPin size={18} />
              <div className="contact-body">
                <span className="contact-label">Based in</span>
                <span className="contact-value">Sofia, Bulgaria</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
