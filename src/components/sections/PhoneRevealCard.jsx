import { Phone } from "lucide-react";

// The number is intentionally never stored or shown anywhere in this file —
// contact goes through LinkedIn or email instead.

export function PhoneRevealCard() {
  return (
    <div className="contact-card contact-static">
      <Phone size={18} />
      <div className="contact-body">
        <span className="contact-label">Phone</span>
        <span className="contact-value contact-value-muted">
          •••• •• •• — reach me via LinkedIn or email instead
        </span>
      </div>
    </div>
  );
}
