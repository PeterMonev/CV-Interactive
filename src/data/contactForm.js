// Web3Forms takes a POST and emails the result — no account, no server of our
// own, no key that is dangerous to expose (an access key can only send mail to
// the address it was issued for, so it is safe in client-side code).
//
// The key lives in VITE_WEB3FORMS_KEY (.env.local locally, project settings on
// Vercel) so it stays out of the repository. Note that this is not secrecy:
// Vite inlines VITE_* variables into the client bundle, so the value ships to
// every visitor either way. That is fine — a Web3Forms access key can only
// send mail to the address it was issued for. Hiding it properly would mean
// putting a serverless function in front, which buys nothing here because the
// endpoint would still be public; captcha, not secrecy, is the anti-spam tool.
//
// With no key set the form stays visible and submits through the visitor's
// mail client instead, so it is never a dead end.
export const CONTACT_FORM = {
  // The page sends to Web3Forms itself. A serverless function cannot: their
  // endpoint sits behind Cloudflare bot protection, which answers a datacentre
  // request with a challenge page whatever headers it carries.
  endpoint: "https://api.web3forms.com/submit",
  // Ours, and it only checks the Turnstile token.
  verifyEndpoint: "/api/contact",
  accessKey: (import.meta.env.VITE_WEB3FORMS_KEY || "").trim(),
  toEmail: "monevpeter@gmail.com",
  subject: "New message from peter-monev-cv-interactive.vercel.app",
};

export const isFormConfigured = () => CONTACT_FORM.accessKey.length > 0;

// Cloudflare Turnstile — the anti-spam half the comment above says is the real
// tool here. The site key is public by design: it identifies the widget, and
// the token it produces is verified in /api/contact against the secret key,
// which lives in a Vercel variable without the VITE_ prefix and so never
// reaches the bundle.
//
// With no site key set the form behaves exactly as it did before any of this.
// That is deliberate: a challenge that fails to load must not be able to lock
// the one way a recruiter has to reach him.
// Web3Forms answer a request carrying a Turnstile token with "You are trying
// to use a Pro feature" on the free plan, so the token cannot go to them. It
// goes to /api/contact instead, which verifies it against Cloudflare and only
// then hands the message on — free, and the secret key never leaves the server.

export const TURNSTILE = {
  siteKey: (import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim(),
  script: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
};

export const isTurnstileConfigured = () => TURNSTILE.siteKey.length > 0;
