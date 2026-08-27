// Verifies the Turnstile token, then hands the message to Web3Forms.
//
// Web3Forms only accept a Turnstile token on a paid plan, so the check has to
// happen before them rather than by them. Cloudflare's siteverify is free and
// has no plan attached; this function calls it with the secret key and only
// forwards mail that passed.
//
// The secret key lives in a Vercel environment variable without the VITE_
// prefix, which is what keeps it server-side: Vite inlines VITE_* into the
// browser bundle, and anything else never leaves the function.
//
// Vercel picks this up automatically because it sits in /api. Locally there is
// no function — vite dev serves static files only — so the form falls back to
// posting Web3Forms directly, without a token. See ContactForm.jsx.

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const WEB3FORMS = "https://api.web3forms.com/submit";
const SITE_ORIGIN = "https://peter-monev-cv-interactive.vercel.app";

const bad = (res, status, message) => res.status(status).json({ success: false, message });

export default async function handler(req, res) {
  if (req.method !== "POST") return bad(res, 405, "Method not allowed");

  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Trimmed on the way in. The value stored on Vercel carries a stray
  // whitespace character — pasted in with the key long ago — and Web3Forms
  // reject it as not a valid UUID. The browser code has trimmed it since the
  // day it was found; this function was passing it raw.
  const accessKey = (process.env.WEB3FORMS_KEY || process.env.VITE_WEB3FORMS_KEY || "").trim();
  if (!accessKey) return bad(res, 500, "The form is not configured on the server.");

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();
  const token = String(body.token || "");

  // The same rules the browser applies, applied again here — a request that
  // skips the page entirely gets no easier ride than one that does not.
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return bad(res, 400, "Please fill in your name, a valid email and a message.");
  }

  // A missing secret means the check is not set up yet, and that must not stop
  // real mail: it degrades to the behaviour the site had before Turnstile.
  if (secret) {
    if (!token) return bad(res, 400, "Please complete the anti-spam check.");
    try {
      const params = new URLSearchParams({ secret, response: token });
      const ip = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"];
      if (ip) params.set("remoteip", String(ip).split(",")[0].trim());

      const verify = await fetch(SITEVERIFY, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      const outcome = await verify.json();
      if (!outcome.success) {
        return bad(res, 400, "The anti-spam check did not pass. Please try again.");
      }
    } catch (err) {
      // Cloudflare being unreachable is not the sender's fault, and a portfolio
      // contact form that silently eats messages is worse than one that lets a
      // rare spam through.
      console.error("turnstile verify failed", err);
    }
  }

  try {
    const sent = await fetch(WEB3FORMS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Web3Forms sit behind Cloudflare, which answers 403 to a request that
        // arrives without the headers a browser would send. From the page these
        // came for free; from a function they have to be set by hand.
        "User-Agent": "peter-monev-cv/1.0 (+https://peter-monev-cv-interactive.vercel.app)",
        Origin: SITE_ORIGIN,
        Referer: SITE_ORIGIN + "/",
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: "New message from peter-monev-cv-interactive.vercel.app",
        from_name: name,
        name,
        email,
        message,
      }),
    });
    // Their refusals are not always JSON — a Cloudflare block page is HTML —
    // so the body is read as text first and only then parsed.
    const raw = await sent.text();
    let result = {};
    try {
      result = JSON.parse(raw);
    } catch (err) {
      result = {};
    }
    if (!sent.ok || !result.success) {
      const detail = result.message || raw.replace(/<[^>]+>/g, " ").replace(/s+/g, " ").trim().slice(0, 90);
      return bad(res, 502, `Mail service HTTP ${sent.status}${detail ? ": " + detail : ""}`);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return bad(res, 502, "Could not reach the mail service.");
  }
}
