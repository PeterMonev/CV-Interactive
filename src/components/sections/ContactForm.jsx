import { useState } from "react";
import { Send, Check, AlertCircle, Loader2 } from "lucide-react";
import { CONTACT_FORM, isFormConfigured } from "../../data/contactForm.js";
import { track, EVENTS } from "../../utils/analytics.js";

const EMPTY = { name: "", email: "", message: "" };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Tell me who you are.";
  if (!values.email.trim()) errors.email = "I need somewhere to reply.";
  // deliberately loose: one @, something either side, a dot in the domain.
  // Anything stricter rejects valid addresses more often than it catches typos.
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "That address doesn't look right.";
  if (values.message.trim().length < 10)
    errors.message = "A sentence or two, so I know what it's about.";
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [botField, setBotField] = useState("");

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
    const found = validate(values);
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus("sent");
        setValues(EMPTY);
        track(EVENTS.CONTACT_SENT, { via: "form" });
      } else {
        setStatus("error");
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
          <p className="cform-done-title">Message on its way.</p>
          <p className="cform-done-sub">
            I read everything and reply from {CONTACT_FORM.toEmail}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={handleSubmit} noValidate>
      <p className="cform-head">Or just write here — no mail client needed.</p>

      <div className="cform-row">
        <label className="cform-field">
          <span className="cform-label">Name</span>
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
          <span className="cform-label">Email</span>
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
        <span className="cform-label">Message</span>
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

      <div className="cform-actions">
        <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <Loader2 size={16} className="cform-spin" /> Sending
            </>
          ) : (
            <>
              <Send size={16} /> Send message
            </>
          )}
        </button>
        {status === "error" && (
          <span className="cform-error cform-error-send">
            <AlertCircle size={14} /> That didn't go through — email{" "}
            {CONTACT_FORM.toEmail} directly.
          </span>
        )}
      </div>
    </form>
  );
}
