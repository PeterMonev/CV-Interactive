import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UI } from "./ui.js";

export const LANGS = [
  { code: "en", label: "EN", name: "English" },
  { code: "bg", label: "BG", name: "Български" },
];

const STORAGE_KEY = "cv-lang";
const LangContext = createContext({ lang: "en", setLang: () => {}, t: (k) => k });

// A stored choice always wins; otherwise follow the browser. Anyone whose
// browser is set to Bulgarian is far more likely to be a Bulgarian recruiter
// than a foreign one, and the toggle is one click away either way.
function detectLang() {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS.some((l) => l.code === saved)) return saved;
  } catch (err) {
    /* private mode or blocked storage — fall through to detection */
  }
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || "";
  return nav.toLowerCase().startsWith("bg") ? "bg" : "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      /* not being able to remember the choice is not worth an error */
    }
  }, [lang]);

  const setLang = useCallback((next) => setLangState(next), []);

  // Look up a dotted key in the UI dictionary. A missing Bulgarian string falls
  // back to English rather than rendering the raw key, so a gap in translation
  // degrades to "readable" instead of "broken".
  const t = useCallback(
    (key) => {
      const walk = (obj) => key.split(".").reduce((acc, part) => (acc == null ? acc : acc[part]), obj);
      const hit = walk(UI[lang]);
      if (typeof hit === "string") return hit;
      const en = walk(UI.en);
      return typeof en === "string" ? en : key;
    },
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

// Resolve a translatable data field. Fields are either a plain string (the same
// in both languages — names, technologies, dates) or { en, bg }. Accepting both
// means data can be translated one entry at a time without breaking the rest.
export function tx(value, lang) {
  if (value == null) return value;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((v) => tx(v, lang));
  return value[lang] ?? value.en ?? "";
}

export function useTx() {
  const { lang } = useLang();
  return useCallback((value) => tx(value, lang), [lang]);
}
