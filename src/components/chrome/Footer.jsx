import { useState, useEffect } from "react";
import { useLang } from "../../i18n/index.jsx";

function useSofiaClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: "Europe/Sofia",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Footer() {
  const sofiaTime = useSofiaClock();
  const { t } = useLang();
  // Mac reports "MacIntel"/"Mac" in platform; everything else gets Ctrl. Read
  // once at render — this only decides which glyph to print, so a wrong guess
  // on an exotic UA costs nothing.
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} Peter Monev</span>
      <span className="footer-tags">{t("footer.tags")}</span>
      <span className="cmdk-hint">
        <kbd>{isMac ? "⌘" : "ctrl"}</kbd>
        <kbd>K</kbd>
        <span>{t("footer.search")}</span>
      </span>
      <span className="footer-clock">Sofia · {sofiaTime}</span>
    </footer>
  );
}
