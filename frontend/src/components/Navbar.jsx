import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAutocomplete } from "../api/client.js";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("sa_theme") || "light");
  const timerRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const data = await getAutocomplete(val.trim());
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 250);
  }

  function handleSelect(symbol) {
    setQuery("");
    setResults([]);
    setOpen(false);
    navigate(`/stock/${encodeURIComponent(symbol)}`);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("sa_theme", next);
  }

  function isActive(path) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="24" height="24">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        Stock Analyzer
      </Link>

      <div className="navbar-search-wrap" ref={wrapRef}>
        <div className="navbar-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search stocks…"
            autoComplete="off"
            spellCheck="false"
            value={query}
            onChange={handleInput}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          />
        </div>

        {open && (
          <div className="nav-ac-dropdown show">
            {results.length === 0 ? (
              <div className="nav-ac-empty">No Indian stocks found</div>
            ) : (
              results.slice(0, 7).map((item) => (
                <div
                  key={item.symbol}
                  className="nav-ac-item"
                  onClick={() => handleSelect(item.symbol)}
                >
                  <span className="nav-ac-name">{item.name}</span>
                  <span className="nav-ac-sym">{item.symbol}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="navbar-right">
        <ul className="navbar-links">
          <li><Link to="/" className={isActive("/") ? "active-nav" : ""}>Home</Link></li>
          <li><Link to="/portfolio" className={isActive("/portfolio") ? "active-nav" : ""}>Portfolio</Link></li>
          <li><a href="#">Screener</a></li>
        </ul>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
