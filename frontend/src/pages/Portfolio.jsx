import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { getFundamentals, getAutocomplete } from "../api/client.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const STORAGE_KEY = "sa_portfolio";

function getPortfolio() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function savePortfolio(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function fmtINR(val) {
  if (val == null || isNaN(val)) return "—";
  return "₹" + Number(Math.abs(val)).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
function fmtPct(val) {
  if (val == null || isNaN(val)) return "—";
  return (val >= 0 ? "+" : "") + val.toFixed(2) + "%";
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(getPortfolio);
  const [prices, setPrices]       = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  const [panelOpen, setPanelOpen]         = useState(false);
  const [addQuery, setAddQuery]           = useState("");
  const [addResults, setAddResults]       = useState([]);
  const [addDropOpen, setAddDropOpen]     = useState(false);
  const [pendingStock, setPendingStock]   = useState(null);
  const [addQty, setAddQty]               = useState("");
  const [addBuyPrice, setAddBuyPrice]     = useState("");
  const [addBuyDate, setAddBuyDate]       = useState("");

  const addTimerRef = useRef(null);
  const addWrapRef  = useRef(null);

  const fetchPrices = useCallback(async (holdings, append = false) => {
    if (!holdings.length) return;
    setLoadingPrices(true);
    const results = await Promise.allSettled(holdings.map((h) => getFundamentals(h.symbol)));
    const map = {};
    results.forEach((r, i) => {
      const sym = holdings[i].symbol;
      map[sym] = r.status === "fulfilled" ? (parseFloat(r.value?.current_price) || null) : null;
    });
    setPrices((prev) => (append ? { ...prev, ...map } : map));
    setLoadingPrices(false);
  }, []);

  useEffect(() => {
    document.title = "Portfolio — Stock Analyzer";
    fetchPrices(portfolio);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e) {
      if (addWrapRef.current && !addWrapRef.current.contains(e.target)) {
        setAddDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleAddInput(e) {
    const val = e.target.value;
    setAddQuery(val);
    clearTimeout(addTimerRef.current);
    if (val.trim().length < 2) { setAddResults([]); setAddDropOpen(false); return; }
    addTimerRef.current = setTimeout(async () => {
      try {
        const data = await getAutocomplete(val.trim());
        setAddResults(data);
        setAddDropOpen(true);
      } catch { setAddResults([]); }
    }, 260);
  }

  function selectPending(item) {
    setPendingStock(item);
    setAddQuery(item.name);
    setAddDropOpen(false);
    setAddResults([]);
  }

  function cancelAdd() {
    setPendingStock(null);
    setAddQuery("");
    setAddResults([]);
    setAddDropOpen(false);
    setAddQty("");
    setAddBuyPrice("");
    setAddBuyDate("");
    setPanelOpen(false);
  }

  function confirmAdd() {
    if (!pendingStock) return;
    const qty      = parseFloat(addQty);
    const buyPrice = parseFloat(addBuyPrice);
    if (!qty || qty <= 0)           { alert("Please enter a valid quantity."); return; }
    if (!buyPrice || buyPrice <= 0) { alert("Please enter a valid buy price."); return; }

    const updated = [...portfolio];
    const idx = updated.findIndex((h) => h.symbol === pendingStock.symbol);
    if (idx >= 0) {
      const ex = updated[idx];
      const total = ex.qty + qty;
      updated[idx] = { ...ex, qty: total, buyPrice: Math.round((ex.qty * ex.buyPrice + qty * buyPrice) / total * 100) / 100 };
    } else {
      updated.push({
        symbol: pendingStock.symbol,
        name:   pendingStock.name,
        qty,
        buyPrice,
        buyDate: addBuyDate || new Date().toISOString().slice(0, 10),
      });
    }
    savePortfolio(updated);
    setPortfolio(updated);
    fetchPrices(updated, true);
    cancelAdd();
  }

  function removeHolding(sym) {
    const updated = portfolio.filter((h) => h.symbol !== sym);
    savePortfolio(updated);
    setPortfolio(updated);
    setPrices((prev) => { const n = { ...prev }; delete n[sym]; return n; });
  }

  function refreshPrices() {
    setPrices({});
    fetchPrices(portfolio);
  }

  let totalInvested = 0, totalCurrent = 0, hasPrice = false;
  portfolio.forEach((h) => {
    totalInvested += h.qty * h.buyPrice;
    const cur = prices[h.symbol];
    if (cur != null) { totalCurrent += h.qty * cur; hasPrice = true; }
  });
  const totalPnl    = hasPrice ? totalCurrent - totalInvested : null;
  const totalPnlPct = (totalPnl !== null && totalInvested > 0) ? (totalPnl / totalInvested) * 100 : null;
  const pnlPos      = totalPnl === null || totalPnl >= 0;

  const withPrices = portfolio.map((h) => {
    const cur = prices[h.symbol];
    if (cur == null) return null;
    const curVal = h.qty * cur;
    const pnlPct = ((cur - h.buyPrice) / h.buyPrice) * 100;
    return { ...h, cur, curVal, pnlPct };
  }).filter(Boolean);

  const best  = withPrices.length ? withPrices.reduce((a, b) => a.pnlPct > b.pnlPct ? a : b) : null;
  const worst = withPrices.length ? withPrices.reduce((a, b) => a.pnlPct < b.pnlPct ? a : b) : null;
  const totalCurVal = withPrices.reduce((s, h) => s + h.curVal, 0);
  const allocTop5   = [...withPrices].sort((a, b) => b.curVal - a.curVal).slice(0, 5);

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="pf-main">
        <div className="pf-page-header">
          <div>
            <h1 className="pf-title">My Portfolio</h1>
            <p className="pf-subtitle">Track your NSE &amp; BSE holdings against live prices</p>
          </div>
          <button className="btn-add-stock" onClick={() => setPanelOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Stock
          </button>
        </div>

        {portfolio.length > 0 && (
          <div className="pf-summary">
            <div className="pf-card">
              <div className="pf-card-label">Total Invested</div>
              <div className="pf-card-value">{fmtINR(totalInvested)}</div>
            </div>
            <div className="pf-card">
              <div className="pf-card-label">Current Value</div>
              <div className="pf-card-value">{hasPrice ? fmtINR(totalCurrent) : "—"}</div>
            </div>
            <div className="pf-card">
              <div className="pf-card-label">Total P&amp;L</div>
              <div className={`pf-card-value${totalPnl == null ? "" : pnlPos ? " gain" : " loss"}`}>
                {totalPnl !== null ? (pnlPos ? "+" : "-") + fmtINR(totalPnl).slice(1) : "—"}
              </div>
            </div>
            <div className="pf-card">
              <div className="pf-card-label">Overall Return</div>
              <div className={`pf-card-value${totalPnlPct == null ? "" : pnlPos ? " gain" : " loss"}`}>
                {fmtPct(totalPnlPct)}
              </div>
            </div>
          </div>
        )}

        {panelOpen && (
          <div className="add-stock-panel visible">
            <div className="add-panel-header">
              <h3>Add a Stock</h3>
              <button className="add-close-btn" onClick={cancelAdd}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="add-search-wrap" ref={addWrapRef}>
              <input
                className="add-search-input"
                type="text"
                placeholder="Search for a stock (e.g. Reliance, Infosys)…"
                autoComplete="off"
                spellCheck="false"
                value={addQuery}
                onChange={handleAddInput}
                onKeyDown={(e) => e.key === "Escape" && setAddDropOpen(false)}
              />
              {addDropOpen && (
                <div className="add-ac-dropdown show">
                  {addResults.length === 0
                    ? <div className="add-ac-empty">No results</div>
                    : addResults.map((item) => (
                      <div key={item.symbol} className="add-ac-item" onClick={() => selectPending(item)}>
                        <span>{item.name}</span>
                        <span className="add-ac-sym">{item.symbol}</span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            {pendingStock && (
              <div className="add-details">
                <div className="add-fields">
                  <div className="add-field">
                    <label>Quantity</label>
                    <input type="number" min="0.001" step="0.001" placeholder="e.g. 10"
                      value={addQty} onChange={(e) => setAddQty(e.target.value)} />
                  </div>
                  <div className="add-field">
                    <label>Buy Price (₹)</label>
                    <input type="number" min="0.01" step="0.01" placeholder="e.g. 2400"
                      value={addBuyPrice} onChange={(e) => setAddBuyPrice(e.target.value)} />
                  </div>
                  <div className="add-field">
                    <label>Buy Date</label>
                    <input type="date" value={addBuyDate} onChange={(e) => setAddBuyDate(e.target.value)} />
                  </div>
                </div>
                <div className="add-actions">
                  <button className="btn-confirm-add" onClick={confirmAdd}>Add to Portfolio</button>
                  <button className="btn-cancel-add" onClick={cancelAdd}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {portfolio.length === 0 ? (
          <div className="pf-empty">
            <div className="pf-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            </div>
            <h2>Your portfolio is empty</h2>
            <p>Start tracking your Indian stock investments by adding your first holding.</p>
            <button className="btn-add-primary" onClick={() => setPanelOpen(true)}>+ Add Your First Stock</button>
          </div>
        ) : (
          <div className="holdings-card">
            <div className="holdings-header">
              <h2 className="holdings-title">
                Holdings <span className="holdings-count">{portfolio.length}</span>
              </h2>
              <button className="btn-refresh" onClick={refreshPrices}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {loadingPrices ? "Loading…" : "Refresh Prices"}
              </button>
            </div>
            <div className="holdings-table-wrap">
              <table className="holdings-table">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th className="num">Qty</th>
                    <th className="num">Avg Buy</th>
                    <th className="num">Current</th>
                    <th className="num">Invested</th>
                    <th className="num">Value</th>
                    <th className="num">P&amp;L (₹)</th>
                    <th className="num">Return</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((h) => {
                    const cur     = prices[h.symbol];
                    const invested = h.qty * h.buyPrice;
                    const curVal  = cur != null ? h.qty * cur : null;
                    const pnl     = curVal !== null ? curVal - invested : null;
                    const pnlPct  = pnl !== null ? (pnl / invested) * 100 : null;
                    const pos     = pnl === null || pnl >= 0;
                    const cls     = pnl === null ? "" : pos ? "gain" : "loss";
                    return (
                      <tr key={h.symbol}>
                        <td>
                          <Link to={`/stock/${encodeURIComponent(h.symbol)}`} className="holdings-link">
                            <div className="h-symbol">{h.symbol.replace(/\.(NS|BO)$/, "")}</div>
                            <div className="h-name">{h.name}</div>
                          </Link>
                        </td>
                        <td className="num">{h.qty}</td>
                        <td className="num">{fmtINR(h.buyPrice)}</td>
                        <td className="num">{cur != null ? fmtINR(cur) : <span className="na">—</span>}</td>
                        <td className="num">{fmtINR(invested)}</td>
                        <td className="num">{curVal !== null ? fmtINR(curVal) : <span className="na">—</span>}</td>
                        <td className={`num ${cls}`}>
                          {pnl !== null ? (pos ? "+" : "-") + fmtINR(pnl).slice(1) : <span className="na">—</span>}
                        </td>
                        <td className={`num ${cls}`}>{fmtPct(pnlPct)}</td>
                        <td>
                          <button className="btn-remove" onClick={() => removeHolding(h.symbol)} title="Remove">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                              <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {withPrices.length > 0 && (
          <div className="pf-insights">
            <div className="insight-card">
              <span className="insight-label">Best Performer</span>
              <div className="insight-name">{best?.name}</div>
              <div className={`insight-val ${best && best.pnlPct >= 0 ? "gain" : "loss"}`}>
                {best ? fmtPct(best.pnlPct) : "—"}
              </div>
            </div>
            <div className="insight-card">
              <span className="insight-label">Worst Performer</span>
              <div className="insight-name">{worst?.name}</div>
              <div className={`insight-val ${worst && worst.pnlPct >= 0 ? "gain" : "loss"}`}>
                {worst ? fmtPct(worst.pnlPct) : "—"}
              </div>
            </div>
            <div className="insight-card">
              <span className="insight-label">Portfolio Allocation</span>
              <div className="alloc-list">
                {allocTop5.map((h) => {
                  const pct = totalCurVal > 0 ? (h.curVal / totalCurVal) * 100 : 0;
                  return (
                    <div key={h.symbol} className="alloc-row">
                      <span className="alloc-sym">{h.symbol.replace(/\.(NS|BO)$/, "")}</span>
                      <div className="alloc-bar-wrap">
                        <div className="alloc-bar" style={{ width: `${pct.toFixed(1)}%` }} />
                      </div>
                      <span className="alloc-pct">{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
