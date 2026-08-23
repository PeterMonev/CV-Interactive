import { track as vercelTrack } from "@vercel/analytics";

// Thin wrapper so components never import the vendor directly. Two reasons:
// swapping providers later touches this file only, and the try/catch means an
// analytics failure — blocked script, ad blocker, offline — can never take a
// click handler down with it. Events are deliberately few and coarse: which
// sections earn attention, and whether the CV actually gets taken away.
export const EVENTS = {
  CV_DOWNLOAD: "cv_download",
  CERT_OPEN: "certificate_open",
  CASE_STUDY_OPEN: "case_study_open",
  PROJECT_OPEN: "project_open",
  TERMINAL_COMMAND: "terminal_command",
  CONTACT_SENT: "contact_sent",
};

export function track(event, props) {
  try {
    vercelTrack(event, props);
  } catch (err) {
    /* analytics is never worth breaking an interaction over */
  }
}
