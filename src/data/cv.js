// The résumé PDF is served straight from public/ — Vite copies that folder into
// dist/ verbatim, so the file is never hashed or run through the bundler and the
// URL below stays stable across builds. CV_FILENAME is what lands in the
// recruiter's downloads folder, so it carries the full name on purpose.
export const CV_FILENAME = "Peter_Monev_CV.pdf";
export const CV_URL = `/${CV_FILENAME}`;
export const CV_LABEL = "Download CV";
