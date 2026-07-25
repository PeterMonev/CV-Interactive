import { ExternalLink, Copy, Check } from "lucide-react";

export function ContactCopyCard({
  icon,
  label,
  value,
  copyValue,
  fieldKey,
  actionHref,
  actionLabel,
  copied,
  onCopy,
}) {
  const external = actionHref.startsWith("http");
  return (
    <div className="contact-card">
      {icon}
      <div className="contact-body">
        <span className="contact-label">{label}</span>
        <span className={`contact-value ${copied ? "contact-value-copied" : ""}`}>
          {copied ? "Copied to clipboard" : value}
        </span>
      </div>
      <div className="contact-actions">
        <a
          href={actionHref}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          aria-label={actionLabel}
          className="icon-btn"
        >
          <ExternalLink size={14} />
        </a>
        <button
          type="button"
          className="icon-btn"
          onClick={() => onCopy(copyValue, fieldKey)}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

