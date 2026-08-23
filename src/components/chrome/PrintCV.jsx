import { useEffect, useRef } from "react";
import { CV_URL, CV_FILENAME } from "../../data/cv.js";
import { track, EVENTS } from "../../utils/analytics.js";

// Ctrl/Cmd+P on an interactive, WebGL-heavy page produces something nobody
// wants to hand to a hiring manager. The résumé already exists as a designed
// two-page PDF, so the shortcut prints that instead: the PDF is loaded into a
// hidden same-origin iframe and printed from there, which keeps it vector-sharp
// and always identical to the downloadable file.
//
// Rasterising the PDF into images was the other option and was rejected — it
// costs bandwidth on every visit, and re-rendering the gradients faithfully is
// not something a rasteriser can be trusted to do.
export function PrintCV() {
  const frameRef = useRef(null);
  const readyRef = useRef(false);

  useEffect(() => {
    // Built only on first use, so a visitor who never prints never pays for it.
    function ensureFrame() {
      if (frameRef.current) return frameRef.current;
      const frame = document.createElement("iframe");
      frame.setAttribute("aria-hidden", "true");
      frame.setAttribute("tabindex", "-1");
      frame.title = CV_FILENAME;
      frame.style.cssText =
        "position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0;opacity:0;";
      frame.onload = () => {
        readyRef.current = true;
      };
      frame.src = CV_URL;
      document.body.appendChild(frame);
      frameRef.current = frame;
      return frame;
    }

    function printPdf() {
      const frame = ensureFrame();
      const attempt = (triesLeft) => {
        try {
          const win = frame.contentWindow;
          if (!win) throw new Error("no content window");
          win.focus();
          win.print();
          track(EVENTS.CV_PRINT, { via: "shortcut" });
          return;
        } catch (err) {
          // Firefox in particular refuses to print a PDF from an iframe. Rather
          // than leave the shortcut doing nothing, hand the file to the
          // browser's own PDF viewer, where Ctrl+P works natively.
          if (triesLeft > 0 && !readyRef.current) {
            setTimeout(() => attempt(triesLeft - 1), 250);
            return;
          }
          track(EVENTS.CV_PRINT, { via: "fallback-tab" });
          window.open(CV_URL, "_blank", "noopener,noreferrer");
        }
      };
      attempt(readyRef.current ? 0 : 8);
    }

    function onKeyDown(e) {
      const isPrint = (e.key === "p" || e.key === "P") && (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey;
      if (!isPrint) return;
      e.preventDefault();
      printPdf();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (frameRef.current && frameRef.current.parentNode) {
        frameRef.current.parentNode.removeChild(frameRef.current);
      }
      frameRef.current = null;
    };
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
