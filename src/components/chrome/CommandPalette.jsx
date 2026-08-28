import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Search,
  CornerDownLeft,
  FileDown,
  Mail,
  Github,
  Linkedin,
  ExternalLink,
  BadgeCheck,
  Hash,
  Copy,
} from "lucide-react";
import { NAV_LINKS } from "../../data/nav.js";
import { PROJECTS } from "../../data/projects.js";
import { CERT_DATA, CERT_FALLBACK_URL } from "../../data/certificates.js";
import { CV_URL, CV_FILENAME } from "../../data/cv.js";
import { track, EVENTS } from "../../utils/analytics.js";
import { useLang, useTx } from "../../i18n/index.jsx";

// Subsequence match, so "cshp" still finds "C# OOP". Scored so tighter and
// earlier matches float up, and an exact prefix always wins. Deliberately tiny:
// a real fuzzy library would outweigh the entire palette.
function score(query, text) {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.startsWith(q)) return 1000;
  const direct = t.indexOf(q);
  if (direct !== -1) return 500 - direct;
  let qi = 0;
  let first = -1;
  let last = -1;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      if (first === -1) first = i;
      last = i;
      qi++;
    }
  }
  if (qi < q.length) return -1;
  return 200 - (last - first) - first;
}

export function CommandPalette({ scrollTo }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const { t } = useLang();
  const tx = useTx();

  const close = useCallback(() => {
    document.body.style.overflow = "";
    setOpen(false);
    setQuery("");
    setActive(0);
    if (restoreFocusRef.current && restoreFocusRef.current.focus) {
      restoreFocusRef.current.focus();
    }
  }, []);

  const openUrl = useCallback((url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const items = useMemo(() => {
    const list = [];
    list.push({
      id: "cv",
      group: t("palette.groups.actions"),
      label: t("palette.downloadCv"),
      hint: t("palette.cvHint"),
      icon: <FileDown size={15} />,
      run: () => {
        track(EVENTS.CV_DOWNLOAD, { from: "command-palette" });
        const a = document.createElement("a");
        a.href = CV_URL;
        a.download = CV_FILENAME;
        document.body.appendChild(a);
        a.click();
        a.remove();
      },
    });
    list.push({
      id: "copy-email",
      group: t("palette.groups.actions"),
      label: t("palette.copyEmail"),
      hint: "monevpeter@gmail.com",
      icon: <Copy size={15} />,
      run: () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText("monevpeter@gmail.com").catch(() => {});
        }
      },
    });
    list.push({
      id: "email",
      group: t("palette.groups.actions"),
      label: t("palette.writeEmail"),
      icon: <Mail size={15} />,
      run: () => {
        window.location.href = "mailto:monevpeter@gmail.com";
      },
    });
    list.push({
      id: "github",
      group: t("palette.groups.actions"),
      label: t("palette.openGithub"),
      icon: <Github size={15} />,
      run: () => openUrl("https://github.com/PeterMonev"),
    });
    list.push({
      id: "linkedin",
      group: t("palette.groups.actions"),
      label: t("palette.openLinkedin"),
      icon: <Linkedin size={15} />,
      run: () => openUrl("https://www.linkedin.com/in/peter-monev-22582b248/"),
    });

    NAV_LINKS.forEach((l) =>
      list.push({
        id: `go-${l.id}`,
        group: t("palette.groups.goto"),
        label: t(`nav.${l.id}`),
        icon: <Hash size={15} />,
        run: () => scrollTo && scrollTo(l.id),
      })
    );

    PROJECTS.forEach((p) =>
      list.push({
        id: `proj-${p.name}`,
        group: t("palette.groups.projects"),
        label: p.name,
        hint: p.stack.slice(0, 3).join(" / "),
        icon: <ExternalLink size={15} />,
        run: () => {
          track(EVENTS.PROJECT_OPEN, { name: p.name, from: "command-palette" });
          openUrl(p.live);
        },
      })
    );

    CERT_DATA.forEach((c) =>
      list.push({
        id: `cert-${c.name}`,
        group: t("palette.groups.certificates"),
        label: c.name,
        hint: "SoftUni",
        icon: <BadgeCheck size={15} />,
        run: () => {
          track(EVENTS.CERT_OPEN, { name: c.name, view: "command-palette" });
          openUrl(c.url || CERT_FALLBACK_URL);
        },
      })
    );

    return list;
  }, [scrollTo, openUrl, t]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return items
      .map((it) => ({
        it,
        s: Math.max(score(q, it.label), score(q, it.group) - 400),
      }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.it);
  }, [items, query]);

  useEffect(() => {
    function onKey(e) {
      const isToggle = (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
      if (isToggle) {
        e.preventDefault();
        setOpen((o) => {
          if (!o) restoreFocusRef.current = document.activeElement;
          return !o;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  // keep the highlighted row visible when arrowing past the fold
  useEffect(() => {
    const el = listRef.current && listRef.current.querySelector(`[data-idx="${active}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onInputKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) {
        close();
        setTimeout(() => item.run(), 0);
      }
    }
  }

  if (!open) return null;

  let lastGroup = null;

  return (
    <div className="cmdk-backdrop" onMouseDown={close}>
      <div
        className="cmdk"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cmdk-input-row">
          <Search size={17} />
          <input
            ref={inputRef}
            className="cmdk-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={t("palette.placeholder")}
            autoComplete="off"
            spellCheck="false"
            aria-label="Search commands"
          />
          <kbd className="cmdk-kbd">esc</kbd>
        </div>

        <div className="cmdk-list" ref={listRef} role="listbox">
          {results.length === 0 && (
            <p className="cmdk-empty">{t("palette.empty")}</p>
          )}
          {results.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {header && <p className="cmdk-group">{header}</p>}
                <button
                  data-idx={i}
                  role="option"
                  aria-selected={i === active}
                  className={`cmdk-item ${i === active ? "cmdk-item-active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    close();
                    setTimeout(() => item.run(), 0);
                  }}
                >
                  <span className="cmdk-item-icon">{item.icon}</span>
                  <span className="cmdk-item-label">{item.label}</span>
                  {item.hint && <span className="cmdk-item-hint">{item.hint}</span>}
                  {i === active && <CornerDownLeft size={13} className="cmdk-enter" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
