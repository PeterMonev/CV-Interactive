import { Phone } from "lucide-react";
import { useLang } from "../../i18n/index.jsx";

// The number is intentionally never stored or shown anywhere in this file —
// contact goes through LinkedIn or email instead.

export function PhoneRevealCard() {
  const { t } = useLang();

  return (
    <div className="contact-card contact-static">
      <Phone size={18} />
      <div className="contact-body">
        <span className="contact-label">{t("contact.phone")}</span>
        <span className="contact-value contact-value-muted">
          •••• •• •• — {t("contact.phoneHint")}
        </span>
      </div>
    </div>
  );
}
