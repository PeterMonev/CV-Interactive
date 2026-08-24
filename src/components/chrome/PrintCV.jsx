import { useEffect } from "react";
import { CV_URL } from "../../data/cv.js";
import { track, EVENTS } from "../../utils/analytics.js";

// Ctrl/Cmd+P on an interactive, WebGL-heavy page produces something nobody
// wants to hand to a hiring manager. The résumé already exists as a designed
// two-page PDF, so the shortcut opens that instead, in the browser's own PDF
// viewer, where printing is one keystroke away and comes out vector-sharp.
//
// This used to print from a hidden iframe, which is neater when it works and
// unreliable in practice: Chrome renders a PDF through an internal plugin, and
// calling print() on that frame can quietly do nothing — no dialog, no error,
// and therefore no way to fall back. Opening the file is less clever and always
// does something the visitor can see.
//
// Rasterising the PDF into images was the other option and was rejected: it
// costs bandwidth on every visit, and the gradients in the sidebar do not
// survive a rasteriser.
export function PrintCV() {
  useEffect(() => {
    function openPdf() {
      track(EVENTS.CV_PRINT, { via: "shortcut" });
      // Called straight out of a keydown handler, so this counts as a user
      // gesture and no popup blocker stops it.
      const win = window.open(CV_URL, "_blank");
      if (!win) {
        // Blocked anyway — navigate instead of doing nothing at all.
        window.location.href = CV_URL;
        return;
      }
      // Best effort: some browsers will raise the print dialog on the viewer
      // once it has loaded. If they do not, the file is open and one keystroke
      // away, which is the point.
      try {
        win.addEventListener("load", () => {
          try {
            win.print();
          } catch (err) {
            /* the viewer is open; the visitor can print it themselves */
          }
        });
      } catch (err) {
        /* cross-origin restrictions on the handle — nothing to do */
      }
    }

    function onKeyDown(e) {
      const isPrint = (e.key === "p" || e.key === "P") && (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey;
      if (!isPrint) return;
      e.preventDefault();
      openPdf();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fallback for anyone who prints from the browser menu, which no shortcut can
  // intercept. Visible only on paper.
  return (
    <div className="print-fallback" aria-hidden="true">
      <h1>Peter Monev</h1>
      <p className="print-fallback-role">Junior Full-Stack Web Developer</p>
      <p>
        This is an interactive résumé and does not print well. The designed
        two-page CV is at:
      </p>
      <p className="print-fallback-url">
        peter-monev-cv-interactive.vercel.app{CV_URL}
      </p>
      <p>
        monevpeter@gmail.com · Sofia, Bulgaria · github.com/PeterMonev ·
        linkedin.com/in/peter-monev-22582b248
      </p>
    </div>
  );
}
