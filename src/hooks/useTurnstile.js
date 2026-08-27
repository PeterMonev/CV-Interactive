import { useEffect, useRef, useState } from "react";
import { TURNSTILE, isTurnstileConfigured } from "../data/contactForm.js";

// Loads Cloudflare Turnstile and renders the widget into a container.
//
// Three things shape this hook.
//
// The script is fetched only when a widget is actually wanted, not on page
// load: it is third-party JavaScript on a page whose whole point is to paint
// fast, and nobody who never reaches the contact section should pay for it.
//
// The widget is rendered explicitly rather than by letting Turnstile scan the
// document for .cf-turnstile elements. Automatic scanning runs once at script
// load, which races a React tree that mounts its sections lazily; explicit
// rendering happens when the element genuinely exists.
//
// And failure is never fatal. If the script is blocked — a privacy extension,
// a corporate network, Cloudflare having a bad day — the hook reports ready
// with no token rather than leaving the form permanently unsubmittable. The
// check is there to cost a spammer time, not to stand between a recruiter and
// the send button.
export function useTurnstile(active) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [token, setToken] = useState("");
  const [state, setState] = useState(
    isTurnstileConfigured() ? "idle" : "disabled"
  );

  useEffect(() => {
    if (!active || !isTurnstileConfigured()) return undefined;

    let cancelled = false;
    let failTimer = null;
    let answerTimer = null;

    const render = () => {
      if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
      if (!window.turnstile) return;
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE.siteKey,
          theme: "dark",
          // flexible stretches to the form width, which is far more presence
          // than a spam check has earned next to the send button
          size: "normal",
          callback: (value) => {
            if (cancelled) return;
            if (answerTimer) clearTimeout(answerTimer);
            setToken(value);
            setState("ready");
          },
          "expired-callback": () => {
            if (cancelled) return;
            setToken("");
            setState("expired");
          },
          "error-callback": () => {
            if (cancelled) return;
            setToken("");
            setState("failed");
          },
        });
        setState("waiting");
        // A widget can render and then never answer — a hostname missing from
        // the Cloudflare list, a blocked iframe, a network that swallows the
        // challenge. Without this the send button stays disabled for good and
        // the visitor has no way to write at all, which is a far worse outcome
        // than letting a spammer through.
        if (answerTimer) clearTimeout(answerTimer);
        answerTimer = setTimeout(() => {
          if (cancelled) return;
          setState((current) => (current === "waiting" ? "failed" : current));
        }, 12000);
      } catch (err) {
        setState("failed");
      }
    };

    if (window.turnstile) {
      render();
    } else {
      const existing = document.querySelector(`script[src="${TURNSTILE.script}"]`);
      const script = existing || document.createElement("script");
      if (!existing) {
        script.src = TURNSTILE.script;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
      script.addEventListener("error", () => !cancelled && setState("failed"));
      // A blocked script fires no error event in some browsers, it simply never
      // loads. Without this the form would wait forever for a token.
      failTimer = setTimeout(() => {
        if (!cancelled && !window.turnstile) setState("failed");
      }, 6000);
    }

    return () => {
      cancelled = true;
      if (failTimer) clearTimeout(failTimer);
      if (answerTimer) clearTimeout(answerTimer);
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (err) {
          /* already gone */
        }
        widgetIdRef.current = null;
      }
    };
  }, [active]);

  const reset = () => {
    setToken("");
    if (widgetIdRef.current !== null && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setState("waiting");
      } catch (err) {
        setState("failed");
      }
    }
  };

  return {
    containerRef,
    token,
    state,
    reset,
    // Anything other than a widget still waiting for its answer lets the send
    // through: disabled means no key, failed means the challenge never loaded.
    blocking: state === "waiting" || state === "expired",
  };
}
