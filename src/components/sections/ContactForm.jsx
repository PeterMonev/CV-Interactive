import { useState, useEffect } from "react";
import { Send, Check, AlertCircle, Loader2 } from "lucide-react";
import { CONTACT_FORM, isFormConfigured } from "../../data/contactForm.js";
import { useTurnstile } from "../../hooks/useTurnstile.js";
import { track, EVENTS } from "../../utils/analytics.js";
import { useLang } from "../../i18n/index.jsx";
import { setContactState, chargeOf } from "../../utils/contactSignal.js";

const EMPTY = { name: "", email: "", message: "" };

function validate(values, t) {
  const errors = {};
  if (!values.name.trim()) errors.name = t("contact.form.errName");
  if (!values.email.trim()) errors.email = t("contact.form.errEmailEmpty");
  // deliberately loose: one @, something either side, a dot in the domain.
  // Anything stricter rejects valid addresses more often than it catches typos.
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = t("contact.form.errEmailShape");
  if (values.message.trim().length < 10)
    errors.message = t("contact.form.errMessage");
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [botField, setBotField] = useState("");
  const { t } = useLang();
  // The widget builds itself only once the form is on the page, and never
  // blocks the send if it failed to load — see the hook for why.
  const turnstile = useTurnstile(true);

  // The orb behind this form watches the same two facts the visitor can see:
  // how far the message has got, and whether it went out. Reported rather than
  // passed as props, because the scene mounts lazily in a different subtree.
  useEffect(() => {
    setContactState({ charge: chargeOf(values) });
  }, [values]);

  useEffect(() => {
    setContactState({ status });
  }, [status]);

  const set = (field) => (e) => {
    const v = e.target.value;
    setValues((prev) => ({ ...prev, [field]: v }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  // Without a key the form would silently fail, so it hands the message to the
  // visitor's mail client fully written instead of pretending to have sent it.
  function fallbackToMail() {
    const body = `${values.message}\n\n— ${values.name} (${values.email})`;
    window.location.href = `mailto:${CONTACT_FORM.toEmail}?subject=${encodeURIComponent(
      CONTACT_FORM.subject
    )}&body=${encodeURIComponent(body)}`;
    setStatus("sent");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (botField) return; // honeypot filled — a human never sees this field
    const found = validate(values, t);
    setErrors(found);
    if (Object.keys(found).length) return;

    if (!isFormConfigured()) {
      fallbackToMail();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(CONTACT_FORM.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: CONTACT_FORM.accessKey,
          subject: CONTACT_FORM.subject,
          from_name: values.name,
          name: values.name,
          email: values.email,
          message: values.message,
          ...(turnstile.token ? { "cf-turnstile-response": turnstile.token } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus("sent");
        setValues(EMPTY);
        track(EVENTS.CONTACT_SENT, { via: "form" });
      } else {
        setStatus("error");
        // a Turnstile token is single use, so a retry needs a fresh one
        turnstile.reset();
      }
    } catch (err) {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="cform cform-done">
        <Check size={20} />
        <div>
          <p className="cform-done-title">{t("contact.form.sentTitle")}</p>
          <p className="cform-done-sub">{t("contact.form.sentSub")}</p>
        </div>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={handleSubmit} noValidate>
      <p className="cform-head">{t("contact.form.head")}</p>

      <div className="cform-row">
        <label className="cform-field">
          <span className="cform-label">{t("contact.form.name")}</span>
          <input
            type="text"
            value={values.name}
            onChange={set("name")}
            className={errors.name ? "cform-invalid" : ""}
            autoComplete="name"
          />
          {errors.name && <span className="cform-error">{errors.name}</span>}
        </label>

        <label className="cform-field">
          <span className="cform-label">{t("contact.form.email")}</span>
          <input
            type="email"
            value={values.email}
            onChange={set("email")}
            className={errors.email ? "cform-invalid" : ""}
            autoComplete="email"
          />
          {errors.email && <span className="cform-error">{errors.email}</span>}
        </label>
      </div>

      <label className="cform-field">
        <span className="cform-label">{t("contact.form.message")}</span>
        <textarea
          rows={4}
          value={values.message}
          onChange={set("message")}
          className={errors.message ? "cform-invalid" : ""}
        />
        {errors.message && <span className="cform-error">{errors.message}</span>}
      </label>

      <input
        type="text"
        className="cform-bot"
        tabIndex={-1}
        autoComplete="off"
        value={botField}
        onChange={(e) => setBotField(e.target.value)}
        aria-hidden="true"
      />

      {/* Empty and invisible until the widget renders, so the form does not
          reserve a gap on a page where the check is switched off. */}
      <div ref={turnstile.containerRef} className="cform-turnstile" />

      <div className="cform-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === "sending" || turnstile.blocking}
        >
          {status === "sending" ? (
            <>
              <Loader2 size={16} className="cform-spin" /> {t("contact.form.sending")}
            </>
          ) : (
            <>
              <Send size={16} /> {t("contact.form.send")}
            </>
          )}
        </button>
        {status === "error" && (
          <span className="cform-error cform-error-send">
            <AlertCircle size={14} /> {t("contact.form.errSend")}
          </span>
        )}
      </div>
    </form>
  );
}
