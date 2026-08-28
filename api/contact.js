// Checks a Turnstile token. Nothing else.
//
// The first version of this also forwarded the message to Web3Forms, which
// failed: Web3Forms sit behind Cloudflare's bot protection, and a request from
// a datacentre gets the "Just a moment..." challenge page no matter which
// browser headers it carries. The same request from a visitor's browser has
// always been fine.
//
// So the work is split. This function answers one question — is this token
// genuine — and the page does the sending itself, exactly as it did before any
// of this existed. The secret key stays here, on the server, which is the only
// place it is allowed to be.

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  // Pasted values pick up a trailing newline or a pair of quotes more often
  // than anyone expects, and Cloudflare answers a secret like that with
  // invalid-input-secret, which reads as a wrong key rather than a dirty one.
  const secret = (process.env.TURNSTILE_SECRET_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();

  // No secret means the check is not set up. Say so plainly rather than
  // failing: the page treats this as "carry on", which is the behaviour the
  // site had before Turnstile existed.
  if (!secret) return res.status(200).json({ ok: true, checked: false });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const token = String(body.token || "");
  if (!token) {
    return res.status(400).json({ ok: false, message: "Please complete the anti-spam check." });
  }

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

    if (outcome.success) return res.status(200).json({ ok: true, checked: true });

    const codes = Array.isArray(outcome["error-codes"]) ? outcome["error-codes"] : [];

    // Cloudflare refuses for two different reasons and only one of them is
    // the sender's. A bad or missing secret, a malformed request, an outage
    // on their side — those are this server being wrong, and the person
    // typing the message did nothing but fill in a form. Blocking them for
    // it means a misconfigured key silently eats every message the site is
    // there to receive, which is exactly what happened in production while
    // the same form worked locally, where there is no function to get it
    // wrong. Same call as an unreachable Cloudflare: log it, let it through.
    const OURS = [
      "missing-input-secret",
      "invalid-input-secret",
      "bad-request",
      "internal-error",
    ];
    if (codes.some((c) => OURS.includes(c))) {
      console.error("turnstile misconfigured, letting the message through:", codes);
      return res.status(200).json({ ok: true, checked: false });
    }

    return res.status(400).json({
      ok: false,
      message: codes.includes("timeout-or-duplicate")
        ? "The anti-spam check expired. Please tick it again and resend."
        : `The anti-spam check did not pass${codes.length ? " (" + codes.join(", ") + ")" : ""}.`,
    });
  } catch (err) {
    // Cloudflare unreachable is not the sender's fault. A portfolio contact
    // form that swallows messages is worse than one that lets rare spam through.
    console.error("turnstile verify failed", err);
    return res.status(200).json({ ok: true, checked: false });
  }
}
