import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CODE_TOKENS } from "../../data/hero.js";
import { SKILLS } from "../../data/skills.js";
import { PROJECTS } from "../../data/projects.js";

export function HeroTerminal({ onHireMe }) {
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
      const [word, ...rest] = cmd.toLowerCase().split(" ");

      if (word === "clear") {
        setHistory([]);
        return;
      }
      if (word === "help") {
        printLines([
          "available commands:",
          "about · experience · skills · projects · contact",
          "open <project>  ·  whoami  ·  clear",
        ]);
        return;
      }
      if (word === "about") {
        printLines([
          "Junior full-stack developer based in Sofia.",
          "JS + PHP (Laravel) in production, now leveling up in C#/ASP.NET Core.",
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
    [onHireMe, printLines]
  );

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      runCommand(input);
      setInput("");
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
        {ready && <span className="term-hint">type 'help'</span>}
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

