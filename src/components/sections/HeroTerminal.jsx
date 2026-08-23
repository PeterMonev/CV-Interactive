import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CODE_TOKENS } from "../../data/hero.js";
import { SKILLS } from "../../data/skills.js";
import { PROJECTS } from "../../data/projects.js";
import { CERT_DATA } from "../../data/certificates.js";
import { EDUCATION } from "../../data/education.js";
import { EXPERIENCE } from "../../data/experience.js";
import { NAV_LINKS } from "../../data/nav.js";
import { CV_URL, CV_FILENAME } from "../../data/cv.js";
import { tx } from "../../i18n/index.jsx";

const en = (v) => tx(v, "en");

// Single source of truth for what the terminal knows, so Tab-completion and
// 'help' can never drift apart from what runCommand actually handles.
const COMMANDS = [
  "about",
  "certs",
  "clear",
  "contact",
  "cv",
  "education",
  "experience",
  "goto",
  "grep",
  "help",
  "open",
  "projects",
  "skills",
  "whoami",
];

export function HeroTerminal({ onHireMe, scrollTo }) {
  const total = useMemo(
    () => CODE_TOKENS.reduce((sum, tok) => sum + tok.t.length, 0),
    []
  );
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  // recall of previously entered commands; index -1 means "editing a fresh line"
  const [cmdHistory, setCmdHistory] = useState([]);
  const [histIndex, setHistIndex] = useState(-1);

  useEffect(() => {
    if (count >= total) {
      setReady(true);
      return;
    }
    const id = setTimeout(() => setCount((c) => c + 1), 16);
    return () => clearTimeout(id);
  }, [count, total]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [history, count]);

  const printLines = useCallback((lines) => {
    setHistory((h) => [...h, ...lines.map((text) => ({ type: "out", text }))]);
  }, []);

  const runCommand = useCallback(
    (raw) => {
      const cmd = raw.trim();
      setHistory((h) => [...h, { type: "in", text: cmd }]);
      if (!cmd) return;
      setCmdHistory((h) => (h[h.length - 1] === cmd ? h : [...h, cmd]));
      const [word, ...rest] = cmd.toLowerCase().split(" ");

      if (word === "clear") {
        setHistory([]);
        return;
      }
      if (word === "help") {
        printLines([
          "available commands:",
          "about · whoami · experience · education · skills · certs",
          "projects · contact · cv",
          "open <project> · goto <section> · grep <term> · clear",
          "tab completes, up/down recalls history",
        ]);
        return;
      }
      if (word === "cv") {
        printLines([`downloading ${CV_FILENAME} — 2 pages`]);
        const a = document.createElement("a");
        a.href = CV_URL;
        a.download = CV_FILENAME;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      if (word === "certs") {
        printLines([
          `${CERT_DATA.length} SoftUni credentials:`,
          ...CERT_DATA.map((c) => `  ${c.name}`),
        ]);
        return;
      }
      if (word === "education") {
        printLines(
          EDUCATION.map((e) => `${en(e.period)} — ${en(e.title)}, ${en(e.school)}`)
        );
        return;
      }
      if (word === "goto") {
        const target = rest.join("-");
        const link = NAV_LINKS.find((l) => l.id === target);
        if (link && scrollTo) {
          printLines([`jumping to ${link.label.toLowerCase()}...`]);
          setTimeout(() => scrollTo(link.id), 300);
        } else {
          printLines([
            `no section "${target || "?"}". try: ${NAV_LINKS.map((l) => l.id).join(", ")}`,
          ]);
        }
        return;
      }
      // honest search: says plainly when something is not in the stack, rather
      // than quietly returning nothing and letting it read as a match
      if (word === "grep") {
        const term = rest.join(" ").trim();
        if (!term) {
          printLines(["usage: grep <term>   e.g. grep signalr"]);
          return;
        }
        const hits = [];
        EXPERIENCE.forEach((job) => {
          const bullets = job.bullets.map(en);
          const matched = bullets.filter((b) => b.toLowerCase().includes(term));
          if (matched.length || en(job.role).toLowerCase().includes(term)) {
            hits.push(`  ${en(job.company)} (${en(job.period)}) — production work`);
            matched.slice(0, 2).forEach((b) =>
              hits.push(`    ${b.length > 92 ? b.slice(0, 92) + "..." : b}`)
            );
          }
        });

        SKILLS.forEach((g) =>
          g.items
            .filter((i) => i.toLowerCase().includes(term))
            .forEach((i) => hits.push(`  ${i} — listed under ${g.group}`))
        );
        PROJECTS.forEach((pr) => {
          if (pr.stack.some((s) => s.toLowerCase().includes(term))) {
            hits.push(`  ${pr.name} — ${pr.stack.join(", ")}`);
          }
        });
        CERT_DATA.filter((c) => c.name.toLowerCase().includes(term)).forEach(
          (c) => hits.push(`  ${c.name} — SoftUni certificate`)
        );
        printLines(
          hits.length
            ? [`${hits.length} match${hits.length > 1 ? "es" : ""} for "${term}":`, ...hits]
            : [`no match for "${term}" — not something I have shipped yet`]
        );
        return;
      }
      if (word === "about") {
        printLines([
          "Junior full-stack developer based in Sofia.",
          "SoftUni diplomas in front-end JavaScript and back-end C#.",
          "A year and a half of production PHP (Laravel) and JavaScript.",
        ]);
        return;
      }
      if (word === "whoami") {
        printLines(["peter-monev · full-stack-developer · sofia-bg"]);
        return;
      }
      if (word === "experience") {
        printLines([
          "Megaparts — Junior Full-Stack Developer (2023–2024)",
          "PHP/Laravel, JavaScript, MySQL, Git",
        ]);
        return;
      }
      if (word === "skills") {
        printLines([SKILLS.map((g) => g.items.join(", ")).join(", ")]);
        return;
      }
      if (word === "projects") {
        printLines(PROJECTS.map((p) => `${p.name} — ${p.live}`));
        return;
      }
      if (word === "contact") {
        printLines([
          "monevpeter@gmail.com",
          "phone — hidden from scrapers, tap to reveal in the Contact section",
          "linkedin.com/in/peter-monev-22582b248",
          "github.com/PeterMonev",
        ]);
        return;
      }
      if (word === "open") {
        const query = rest.join(" ");
        const match = PROJECTS.find((p) =>
          p.name.toLowerCase().includes(query)
        );
        if (match) {
          printLines([`opening ${match.name}...`]);
          window.open(match.live, "_blank", "noopener,noreferrer");
        } else {
          printLines([`no project matching "${query}". try: open rehearsalhub`]);
        }
        return;
      }
      if (word === "sudo" && rest.join(" ") === "hire-me") {
        printLines(["permission granted.", "redirecting to contact section..."]);
        setTimeout(() => onHireMe && onHireMe(), 500);
        return;
      }
      printLines([`command not found: ${word} — type 'help'`]);
    },
    [onHireMe, printLines, scrollTo]
  );

  // Tab completes the command word, or the argument once a command that takes
  // one has been typed. A unique match fills itself in; several matches print
  // the candidates rather than guessing.
  const complete = useCallback(
    (value) => {
      const parts = value.split(" ");
      if (parts.length <= 1) {
        const stem = (parts[0] || "").toLowerCase();
        const hits = COMMANDS.filter((c) => c.startsWith(stem));
        if (hits.length === 1) return hits[0] + " ";
        if (hits.length > 1) printLines([hits.join("  ")]);
        return value;
      }
      const [word, ...rest] = parts;
      const stem = rest.join(" ").toLowerCase();
      let pool = null;
      if (word.toLowerCase() === "open") {
        pool = PROJECTS.map((pr) => pr.name);
      } else if (word.toLowerCase() === "goto") {
        pool = NAV_LINKS.map((l) => l.id);
      }
      if (!pool) return value;
      const hits = pool.filter((n) => n.toLowerCase().startsWith(stem));
      if (hits.length === 1) return `${word} ${hits[0]}`;
      if (hits.length > 1) printLines([hits.join("  ")]);
      return value;
    },
    [printLines]
  );

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      runCommand(input);
      setInput("");
      setHistIndex(-1);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const completed = complete(input);
      if (completed !== input) setInput(completed);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!cmdHistory.length) return;
      const next = histIndex < 0 ? cmdHistory.length - 1 : Math.max(0, histIndex - 1);
      setHistIndex(next);
      setInput(cmdHistory[next]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIndex < 0) return;
      const next = histIndex + 1;
      if (next >= cmdHistory.length) {
        setHistIndex(-1);
        setInput("");
      } else {
        setHistIndex(next);
        setInput(cmdHistory[next]);
      }
    }
  }

  let remaining = count;
  const introRendered = [];
  for (let i = 0; i < CODE_TOKENS.length; i++) {
    const tok = CODE_TOKENS[i];
    if (remaining <= 0) break;
    const take = Math.min(tok.t.length, remaining);
    introRendered.push(
      <span key={i} className={`tok-${tok.c}`}>
        {tok.t.slice(0, take)}
      </span>
    );
    remaining -= take;
  }

  return (
    <div
      className="hero-term"
      onClick={() => inputRef.current && inputRef.current.focus()}
    >
      <div className="term-bar">
        <span className="term-path">~/peter-monev.dev</span>
        {ready && <span className="term-hint">type 'help' · tab completes</span>}
      </div>
      <div className="term-body" ref={bodyRef}>
        <pre className="intro-pre">
          {introRendered}
          {!ready && <span className="caret">▌</span>}
        </pre>
        {ready && (
          <div className="term-log">
            {history.map((line, i) => (
              <div key={i} className={`term-line term-${line.type}`}>
                {line.type === "in" ? (
                  <span className="term-prompt-sym">$ </span>
                ) : null}
                {line.text}
              </div>
            ))}
            <div className="term-line term-in">
              <span className="term-prompt-sym">$ </span>
              <input
                ref={inputRef}
                className="term-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck="false"
                aria-label="Terminal command input"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

