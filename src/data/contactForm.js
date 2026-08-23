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
  accessKey: import.meta.env.VITE_WEB3FORMS_KEY || "",
  toEmail: "monevpeter@gmail.com",
  subject: "New message from peter-monev-cv-interactive.vercel.app",
};

export const isFormConfigured = () => CONTACT_FORM.accessKey.trim().length > 0;
