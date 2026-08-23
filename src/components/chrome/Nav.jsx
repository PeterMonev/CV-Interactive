import { Terminal, Menu, X, Download } from "lucide-react";
import { NAV_LINKS } from "../../data/nav.js";
import { CV_URL, CV_FILENAME, CV_LABEL } from "../../data/cv.js";
import { track, EVENTS } from "../../utils/analytics.js";

export function Nav({
  navLinksRef,
  linkRefs,
  active,
  scrollTo,
  indicator,
  menuOpen,
  setMenuOpen,
}) {
  return (
    <>
      <header className="nav">
        <button className="nav-brand" onClick={() => scrollTo("home")}>
          <Terminal size={16} />
          <span>peter monev</span>
        </button>

        <div className="nav-right">
          <nav className="nav-links" ref={navLinksRef}>
            <span
              className="nav-indicator"
              style={{
                transform: `translateX(${indicator.left}px)`,
                width: indicator.width,
                opacity: indicator.opacity,
              }}
            />
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                ref={(el) => (linkRefs.current[link.id] = el)}
                className={`nav-link ${active === link.id ? "nav-link-active" : ""}`}
                onClick={() => scrollTo(link.id)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <a
            className="nav-cv"
            href={CV_URL}
            download={CV_FILENAME}
            onClick={() => track(EVENTS.CV_DOWNLOAD, { from: "nav" })}
            aria-label={`${CV_LABEL} (PDF)`}
          >
            <Download size={15} />
            <span className="nav-cv-full">{CV_LABEL}</span>
            <span className="nav-cv-short">CV</span>
          </a>

          <button
            className="nav-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="nav-mobile">
          {NAV_LINKS.map((link) => (
            <button key={link.id} onClick={() => scrollTo(link.id)}>
              {link.label}
            </button>
          ))}
          <a
            className="nav-mobile-cv"
            href={CV_URL}
            download={CV_FILENAME}
            onClick={() => {
              track(EVENTS.CV_DOWNLOAD, { from: "mobile-menu" });
              setMenuOpen(false);
            }}
          >
            <Download size={15} /> {CV_LABEL}
          </a>
        </div>
      )}
    </>
  );
}
