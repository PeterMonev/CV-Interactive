import { Terminal, Menu, X } from "lucide-react";
import { NAV_LINKS } from "../../data/nav.js";

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

        <button
          className="nav-toggle"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {menuOpen && (
        <div className="nav-mobile">
          {NAV_LINKS.map((link) => (
            <button key={link.id} onClick={() => scrollTo(link.id)}>
              {link.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
