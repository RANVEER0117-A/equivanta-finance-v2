import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const APIS = [
  {
    name: "Yahoo Finance (yfinance)",
    status: "active",
    desc: "Primary data source. Provides real-time prices, fundamentals, financials, and 52-week ranges for NSE & BSE listed stocks.",
  },
  {
    name: "TradingView Charts",
    status: "active",
    desc: "Embedded interactive candlestick charts with technical indicators, multiple timeframes, and drawing tools.",
  },
  {
    name: "Mock Fallback",
    status: "active",
    desc: "Deterministic offline data source used when live APIs are unavailable. Useful for development and testing.",
  },
  {
    name: "Finnhub",
    status: "planned",
    desc: "Real-time websocket prices, earnings, and news. Requires an API key — planned for a future release.",
  },
  {
    name: "Alpha Vantage",
    status: "planned",
    desc: "Historical OHLCV data, technical indicators, and fundamentals. Requires an API key — planned for a future release.",
  },
  {
    name: "Twelve Data",
    status: "planned",
    desc: "Global market data with real-time and historical coverage. Requires an API key — planned for a future release.",
  },
];

const STEPS = [
  { n: "1", title: "You search", body: "Type a company name or NSE/BSE symbol in the search bar. The autocomplete suggests matching Indian stocks from a curated list of 100+ companies." },
  { n: "2", title: "Backend fetches data", body: "Your request is sent to the FastAPI backend, which calls Yahoo Finance (yfinance). Results are cached for 15 minutes to keep things fast." },
  { n: "3", title: "Data is normalised", body: "Raw API data is cleaned — NaN values replaced, figures converted to INR Crore, percentages formatted — before being sent to the frontend." },
  { n: "4", title: "You see the analysis", body: "The stock page shows live price, key metrics, an interactive TradingView chart, financial tables, and an AI-style strengths / weaknesses summary." },
];

export default function About() {
  return (
    <>
      <Navbar />
      <div className="about-page">

        <section className="about-hero">
          <h1>About Stock Analyzer</h1>
          <p>
            A full-stack Indian equity research tool built with FastAPI, React, and yfinance.
            Designed to give retail investors a Screener.in-style experience — free, fast, and transparent.
          </p>
        </section>

        <section className="about-section">
          <h2>How it works</h2>
          <div className="about-steps">
            {STEPS.map((s) => (
              <div key={s.n} className="about-step">
                <div className="about-step-num">{s.n}</div>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2>Supported data sources</h2>
          <div className="about-apis">
            {APIS.map((api) => (
              <div key={api.name} className={`about-api-card ${api.status}`}>
                <div className="about-api-header">
                  <span className="about-api-name">{api.name}</span>
                  <span className={`about-api-badge ${api.status}`}>
                    {api.status === "active" ? "Active" : "Planned"}
                  </span>
                </div>
                <p>{api.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2>Features</h2>
          <div className="about-features">
            {[
              ["Stock Search", "Autocomplete across 100+ NSE & BSE listed companies"],
              ["Live Fundamentals", "Market cap, P/E, ROE, margins, 52W high/low, book value, and more"],
              ["Interactive Charts", "TradingView powered candlestick charts with full technical indicator support"],
              ["Financial Tables", "Quarterly and annual P&L, Balance Sheet, Cash Flow in ₹ Crore"],
              ["Portfolio Tracker", "Track holdings locally with live P&L and allocation breakdown — no login required"],
              ["Dark Mode", "Full dark-mode support stored in your browser"],
              ["Offline-safe", "Mock fallback ensures the app never breaks due to API failures"],
            ].map(([title, desc]) => (
              <div key={title} className="about-feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div>
                  <strong>{title}</strong>
                  <span> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2>Tech stack</h2>
          <div className="about-tech">
            {[
              ["Backend", "Python · FastAPI · yfinance · In-memory cache"],
              ["Frontend", "React 18 · Vite · React Router v6"],
              ["Charts", "TradingView Lightweight Widgets"],
              ["Deployment", "Render (backend) · Vercel (frontend)"],
            ].map(([layer, stack]) => (
              <div key={layer} className="about-tech-row">
                <span className="about-tech-layer">{layer}</span>
                <span className="about-tech-stack">{stack}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="about-disclaimer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <div>
            <strong>Disclaimer</strong>
            <p>
              Stock Analyzer is provided for <strong>informational and educational purposes only</strong>.
              The data displayed is sourced from third-party APIs and may be delayed or inaccurate.
              Nothing on this platform constitutes financial advice, investment advice, trading advice,
              or any other type of advice. Always do your own research and consult a qualified financial
              advisor before making any investment decisions. Past performance is not indicative of future results.
            </p>
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
}
