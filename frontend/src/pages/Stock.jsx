import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getFundamentals, getFinancials } from "../api/client.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

function fmtNum(val) {
  if (val === null || val === undefined) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fmtINR(val) {
  if (val === null || val === undefined) return "—";
  return "₹" + Number(val).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function Spinner() {
  return <div className="loading-spinner"><div className="spinner" /></div>;
}

function NoData({ msg }) {
  return <div className="no-data">{msg || "Data not available"}</div>;
}

function FinancialTable({ data }) {
  if (!data || !data.columns || data.columns.length === 0) return <NoData />;
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            {data.columns.map((col) => <th key={col}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.label}>
              <td className="row-label">{row.label}</td>
              {row.values.map((v, i) => (
                <td key={i} className={v !== null && parseFloat(v) < 0 ? "val-negative" : ""}>
                  {v !== null ? fmtNum(v) : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildProscons(data) {
  const raw = data._raw || {};
  const pros = [], cons = [];

  const pct2 = (v) => v != null ? `${Number(v).toFixed(2)}%` : "—";

  if (raw.roe > 0.20) pros.push(`Strong return on equity of ${pct2(data.roe)}`);
  else if (raw.roe !== null && raw.roe < 0.10) cons.push(`Low return on equity of ${pct2(data.roe)}`);

  if (raw.pm > 0.15) pros.push(`Healthy profit margins of ${pct2(data.profit_margin)}`);
  else if (raw.pm !== null && raw.pm < 0.05) cons.push(`Thin profit margins of ${pct2(data.profit_margin)}`);

  const pe = parseFloat(data.pe_ratio);
  if (!isNaN(pe) && pe > 0 && pe < 25) pros.push(`Reasonably valued at a P/E of ${pe}×`);
  else if (!isNaN(pe) && pe > 50) cons.push(`Expensive valuation — P/E of ${pe}×`);

  if (raw.dy > 0.025) pros.push(`Good dividend yield of ${pct2(data.dividend_yield)}`);

  if (raw.de !== null && raw.de < 0.5) pros.push("Company operates with low debt");
  else if (raw.de > 2) cons.push(`High debt-to-equity ratio of ${data.debt_to_equity}`);

  if (raw.rg > 0.15) pros.push(`Strong revenue growth of ${pct2(data.revenue_growth)}`);
  else if (raw.rg !== null && raw.rg < 0) cons.push(`Revenue declined ${pct2(data.revenue_growth)} year-on-year`);

  if (raw.cr > 1.5) pros.push(`Healthy current ratio of ${data.current_ratio}`);
  else if (raw.cr !== null && raw.cr < 1) cons.push(`Current ratio below 1 (${data.current_ratio}) — potential liquidity risk`);

  return { pros, cons };
}

export default function Stock() {
  const { symbol } = useParams();
  const decoded = decodeURIComponent(symbol);

  const [data, setData] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [activeTab, setActiveTab] = useState("top");
  const chartLoaded = useRef(false);

  useEffect(() => {
    if (!decoded) return;
    setLoading(true);
    setError(null);
    setWarning(null);
    setData(null);
    setFinancials(null);
    chartLoaded.current = false;

    Promise.allSettled([
      getFundamentals(decoded),
      getFinancials(decoded),
    ]).then(([fundResult, finResult]) => {
      if (fundResult.status === "fulfilled") {
        setData(fundResult.value);
        if (fundResult.value._warning) setWarning(fundResult.value._warning);
      } else {
        setError(fundResult.reason?.message || "Failed to load fundamentals");
      }
      if (finResult.status === "fulfilled") {
        setFinancials(finResult.value);
      }
    }).finally(() => setLoading(false));
  }, [decoded]);

  useEffect(() => {
    if (!data || chartLoaded.current) return;
    chartLoaded.current = true;
    document.title = `${data.name || decoded} — Stock Analyzer`;

    const tvSymbol = decoded.endsWith(".NS")
      ? `NSE:${decoded.replace(".NS", "")}`
      : decoded.endsWith(".BO")
      ? `BSE:${decoded.replace(".BO", "")}`
      : decoded;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          container_id: "tradingview_chart",
          symbol: tvSymbol,
          interval: "D",
          timezone: "Asia/Kolkata",
          theme: document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light",
          style: "1",
          locale: "en",
          toolbar_bg: "#ffffff",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          autosize: true,
          studies: ["RSI@tv-basicstudies"],
        });
      }
    };
    document.head.appendChild(script);
  }, [data, decoded]);

  useEffect(() => {
    if (!data) return;
    const sections = document.querySelectorAll(".stock-container section[id]");
    const tabs = document.querySelectorAll(".subnav-tab");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveTab(entry.target.id);
        }
      });
    }, { rootMargin: "-60px 0px -60% 0px", threshold: 0 });
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [data]);

  function fmtPctVal(v) {
    return v != null ? `${fmtNum(v)}%` : "—";
  }

  const metrics = data ? [
    ["Market Cap",     data.market_cap_cr != null ? `₹${fmtNum(data.market_cap_cr)} Cr` : "—"],
    ["Current Price",  data.current_price != null ? fmtINR(data.current_price) : "—"],
    ["52W High",       fmtINR(data.week_high_52)],
    ["52W Low",        fmtINR(data.week_low_52)],
    ["Stock P/E",      data.pe_ratio != null ? fmtNum(data.pe_ratio) : "—"],
    ["Book Value",     data.book_value != null ? fmtINR(data.book_value) : "—"],
    ["Dividend Yield", fmtPctVal(data.dividend_yield)],
    ["ROE",            fmtPctVal(data.roe)],
    ["Profit Margin",  fmtPctVal(data.profit_margin)],
    ["Debt / Equity",  data.debt_to_equity != null ? fmtNum(data.debt_to_equity) : "—"],
  ] : [];

  const ratios = data ? [
    { label: "P/E Ratio",        val: data.pe_ratio != null ? fmtNum(data.pe_ratio) : "—" },
    { label: "Forward P/E",      val: data.forward_pe != null ? fmtNum(data.forward_pe) : "—" },
    { label: "PEG Ratio",        val: data.peg_ratio != null ? fmtNum(data.peg_ratio) : "—" },
    { label: "Price / Book",     val: (data.book_value && data.current_price)
        ? fmtNum(data.current_price / data.book_value) : "—" },
    { label: "ROE",              val: fmtPctVal(data.roe) },
    { label: "ROA",              val: fmtPctVal(data.roa) },
    { label: "Profit Margin",    val: fmtPctVal(data.profit_margin) },
    { label: "Operating Margin", val: fmtPctVal(data.op_margin) },
    { label: "Revenue Growth",   val: fmtPctVal(data.revenue_growth) },
    { label: "Earnings Growth",  val: fmtPctVal(data.earnings_growth) },
    { label: "Debt / Equity",    val: data.debt_to_equity != null ? fmtNum(data.debt_to_equity) : "—" },
    { label: "Current Ratio",    val: data.current_ratio != null ? fmtNum(data.current_ratio) : "—" },
  ] : [];

  const { pros, cons } = data ? buildProscons(data) : { pros: [], cons: [] };

  return (
    <div className="page-wrapper">
      <Navbar />

      {data && (
        <div className="company-subnav">
          <div className="company-subnav-inner">
            <div className="company-subnav-top">
              <span className="subnav-company-name">{data.name || decoded}</span>
              <span className="subnav-price">
                {data.current_price != null ? fmtINR(data.current_price) : "—"}
              </span>
            </div>
            <nav className="company-subnav-tabs">
              {[
                ["top",           "Summary"],
                ["chart",         "Chart"],
                ["about",         "About"],
                ["quarters",      "Quarters"],
                ["profit-loss",   "P&L"],
                ["balance-sheet", "Balance Sheet"],
                ["cash-flow",     "Cash Flow"],
                ["ratios",        "Ratios"],
              ].map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`subnav-tab${activeTab === id ? " active" : ""}`}
                  data-section={id}
                  onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="stock-container">
        <Link to="/" className="back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to search
        </Link>

        {loading && (
          <section className="section-card">
            <div className="metrics-loading"><Spinner /></div>
          </section>
        )}

        {error && (
          <section className="section-card error-card">
            <h2>Could not load data</h2>
            <p>{error}</p>
            <p>Check the symbol is valid (e.g. RELIANCE.NS, TCS.NS)</p>
          </section>
        )}

        {warning && !error && (
          <div className="warning-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {warning} The chart below is still available.
          </div>
        )}

        {data && (
          <>
            <section id="top" className="section-card">
              <div className="company-header">
                <div>
                  <h1 className="company-title">{data.name || decoded}</h1>
                  <div className="company-meta">
                    <span className="exchange-badge">{data.exchange || "NSE"}</span>
                    {data.sector && <span className="company-sector-tag">{data.sector}{data.industry ? ` · ${data.industry}` : ""}</span>}
                  </div>
                </div>
                <div className="company-price-block">
                  <div className="company-price">{data.current_price != null ? fmtNum(data.current_price) : "—"}</div>
                  <div className="company-price-label">Current Price (₹)</div>
                </div>
              </div>
              <div className="metrics-grid">
                {metrics.map(([label, val]) => (
                  <div key={label} className="metric-item">
                    <span className="metric-label">{label}</span>
                    <span className="metric-value">{val}</span>
                  </div>
                ))}
              </div>
            </section>

            <section id="chart" className="section-card">
              <div className="section-header">Price Chart</div>
              <div id="tradingview_chart" style={{ height: 500 }} />
            </section>

            <section id="about" className="section-card">
              <div className="section-header">About the Company</div>
              <div className="about-grid">
                <div>
                  {data.description
                    ? <p className="company-description">{data.description.slice(0, 600)}{data.description.length > 600 ? "…" : ""}</p>
                    : <p className="company-description" style={{ color: "#999" }}>No description available.</p>
                  }
                </div>
                <div className="strengths-weaknesses">
                  <div className="sw-block">
                    <div className="sw-block-title positive">Strengths</div>
                    <ul className="sw-list pros">
                      {pros.length ? pros.map((p, i) => <li key={i}>{p}</li>)
                        : <li style={{ color: "#999" }}>No notable strengths found.</li>}
                    </ul>
                  </div>
                  <div className="sw-block" style={{ marginTop: "1rem" }}>
                    <div className="sw-block-title negative">Weaknesses</div>
                    <ul className="sw-list cons">
                      {cons.length ? cons.map((c, i) => <li key={i}>{c}</li>)
                        : <li style={{ color: "#999" }}>No notable concerns found.</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section id="quarters" className="section-card">
              <div className="section-header">
                Quarterly Results <span className="unit-note">Figures in ₹ Crore</span>
              </div>
              {financials ? <FinancialTable data={financials.quarterly} /> : <Spinner />}
            </section>

            <section id="profit-loss" className="section-card">
              <div className="section-header">
                Profit &amp; Loss (Annual) <span className="unit-note">Figures in ₹ Crore</span>
              </div>
              {financials ? <FinancialTable data={financials.annual} /> : <Spinner />}
            </section>

            <section id="balance-sheet" className="section-card">
              <div className="section-header">
                Balance Sheet <span className="unit-note">Figures in ₹ Crore</span>
              </div>
              {financials ? <FinancialTable data={financials.balance_sheet} /> : <Spinner />}
            </section>

            <section id="cash-flow" className="section-card">
              <div className="section-header">
                Cash Flows <span className="unit-note">Figures in ₹ Crore</span>
              </div>
              {financials ? <FinancialTable data={financials.cash_flow} /> : <Spinner />}
            </section>

            <section id="ratios" className="section-card">
              <div className="section-header">Key Financial Ratios</div>
              <div className="ratios-grid">
                {ratios.map((r) => (
                  <div key={r.label} className="ratio-item">
                    <span className="ratio-label">{r.label}</span>
                    <span className="ratio-value">{r.val}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
