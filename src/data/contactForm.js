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
  endpoint: "https://api.web3forms.com/submit",
  accessKey: (import.meta.env.VITE_WEB3FORMS_KEY || "").trim(),
  toEmail: "monevpeter@gmail.com",
  subject: "New message from peter-monev-cv-interactive.vercel.app",
};

export const isFormConfigured = () => CONTACT_FORM.accessKey.length > 0;

// Cloudflare Turnstile — the anti-spam half the comment above says is the real
// tool here. The site key is public by design: it identifies the widget, and
// the token it produces is verified server-side by Web3Forms against the
// secret key, which is entered in the Web3Forms dashboard and never touches
// this repository or the bundle.
//
// With no site key set the form behaves exactly as it does today. That is
// deliberate: a challenge that fails to load must not be able to lock the one
// way a recruiter has to reach him.
// Web3Forms answers a request carrying a Turnstile token with "You are trying
// to use a Pro feature" on the free plan, which means sending one breaks the
// form outright. Until the token has somewhere that can actually verify it,
// the widget stays off — a challenge nobody checks is theatre, and one that
// blocks real mail is worse than none.
const TURNSTILE_VERIFIER_READY = false;

export const TURNSTILE = {
  siteKey: TURNSTILE_VERIFIER_READY
    ? (import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim()
    : "",
  script: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
};

export const isTurnstileConfigured = () => TURNSTILE.siteKey.length > 0;
