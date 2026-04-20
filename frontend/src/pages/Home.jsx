import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAutocomplete } from "../api/client.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const POPULAR = [
  { symbol: "RELIANCE.NS", label: "RELIANCE" },
  { symbol: "TCS.NS",      label: "TCS" },
  { symbol: "HDFCBANK.NS", label: "HDFC Bank" },
  { symbol: "INFY.NS",     label: "Infosys" },
  { symbol: "WIPRO.NS",    label: "Wipro" },
  { symbol: "ICICIBANK.NS",label: "ICICI Bank" },
  { symbol: "HINDUNILVR.NS",label: "HUL" },
  { symbol: "BAJFINANCE.NS",label: "Bajaj Finance" },
  { symbol: "SBIN.NS",     label: "SBI" },
  { symbol: "MARUTI.NS",   label: "Maruti" },
  { symbol: "TATAMOTORS.NS",label: "Tata Motors" },
  { symbol: "ADANIENT.NS", label: "Adani Ent." },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

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
    navigate(`/stock/${encodeURIComponent(symbol)}`);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (results.length > 0) {
      handleSelect(results[0].symbol);
    } else if (query.trim()) {
      handleSelect(query.trim().toUpperCase());
    }
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="hero">
        <div className="hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
          </svg>
          NSE &amp; BSE Listed Stocks
        </div>

        <h1>Search &amp; Analyze<br /><span>Indian Stocks</span></h1>
        <p>Real-time charts, fundamentals, and key metrics for every stock on NSE and BSE.</p>

        <form className="search-container" onSubmit={handleSearchSubmit}>
          <div className="search-wrapper" ref={wrapRef}>
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by company name or symbol…"
              autoComplete="off"
              value={query}
              onChange={handleInput}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            />
            <button type="submit" className="search-btn">Search</button>

            {open && (
              <div className="autocomplete-dropdown show">
                {results.length === 0 ? (
                  <div className="autocomplete-empty">No stocks found</div>
                ) : (
                  results.slice(0, 7).map((item) => (
                    <div
                      key={item.symbol}
                      className="autocomplete-item"
                      onClick={() => handleSelect(item.symbol)}
                    >
                      <span className="autocomplete-name">{item.name}</span>
                      <span className="autocomplete-symbol">{item.symbol}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </form>

        <div className="features-strip">
          <div className="feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            Live TradingView Charts
          </div>
          <div className="feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
            </svg>
            Key Fundamentals
          </div>
          <div className="feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M16 8v8M12 11v5M8 14v2M3 20h18" />
            </svg>
            Portfolio Tracker
          </div>
        </div>
      </main>

      <section className="popular-section">
        <div className="section-title">Popular Stocks</div>
        <div className="popular-chips">
          {POPULAR.map((s) => (
            <Link key={s.symbol} className="popular-chip" to={`/stock/${encodeURIComponent(s.symbol)}`}>
              {s.label}
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
