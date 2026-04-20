const API_BASE = "http://127.0.0.1:8000";
const PORTFOLIO_KEY = "sa_portfolio";

// ── Storage ─────────────────────────────────────────────
function getPortfolio() {
  try {
    return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePortfolio(arr) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(arr));
}

// ── Price cache ─────────────────────────────────────────
const priceCache = {};

// safe fetch
async function fetchPrice(symbol) {
  if (symbol in priceCache) return priceCache[symbol];

  try {
    const res = await fetch(
      `${API_BASE}/fundamentals?symbol=${encodeURIComponent(symbol)}`
    );

    if (!res.ok) throw new Error("API error");

    const d = await res.json();
    const p = parseFloat(d?.current_price);

    priceCache[symbol] = isNaN(p) ? null : p;
    return priceCache[symbol];

  } catch {
    priceCache[symbol] = null;
    return null;
  }
}

async function fetchAllPrices(holdings) {
  await Promise.all(holdings.map((h) => fetchPrice(h.symbol)));
}

// ── Portfolio ops ───────────────────────────────────────
function addHolding(symbol, name, qty, buyPrice, buyDate) {
  const portfolio = getPortfolio();
  const idx = portfolio.findIndex((h) => h.symbol === symbol);

  qty = Number(qty);
  buyPrice = Number(buyPrice);

  if (!qty || !buyPrice) return;

  if (idx >= 0) {
    const existing = portfolio[idx];
    const totalQty = existing.qty + qty;

    const avgPrice =
      (existing.qty * existing.buyPrice + qty * buyPrice) / totalQty;

    portfolio[idx] = {
      ...existing,
      qty: totalQty,
      buyPrice: Number(avgPrice.toFixed(2)),
    };
  } else {
    portfolio.push({
      symbol,
      name,
      qty,
      buyPrice,
      buyDate: buyDate || new Date().toISOString().slice(0, 10),
    });
  }

  savePortfolio(portfolio);
  renderPage(); // 🔥 IMPORTANT FIX
}

function removeHolding(symbol) {
  const updated = getPortfolio().filter((h) => h.symbol !== symbol);
  savePortfolio(updated);

  delete priceCache[symbol];
  renderPage(); // 🔥 IMPORTANT FIX
}

// ── Formatters ──────────────────────────────────────────
function fmtINR(val) {
  if (val == null || isNaN(val)) return "—";
  return "₹" + Number(val).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fmtPct(val) {
  if (val == null || isNaN(val)) return "—";
  return (val >= 0 ? "+" : "") + val.toFixed(2) + "%";
}

// ── Render engine ───────────────────────────────────────
function renderPage() {
  const portfolio = getPortfolio();
  const content = document.getElementById("pfContent");

  if (!content) return;

  if (!portfolio.length) {
    content.innerHTML = `<div class="pf-empty">No holdings yet</div>`;
    return;
  }

  renderLoading(content, portfolio);

  fetchAllPrices(portfolio).then(() => {
    renderTable(content, portfolio);
    renderSummary(portfolio);
    renderInsights(portfolio);
  });
}

function renderLoading(content, portfolio) {
  content.innerHTML = `
    <div class="holdings-card">
      <h2>Holdings (${portfolio.length})</h2>
      <div class="holdings-loading">Loading prices...</div>
    </div>
  `;
}

// ── Table ───────────────────────────────────────────────
function renderTable(content, portfolio) {
  const rows = portfolio.map((h) => {
    const cur = priceCache[h.symbol];

    const invested = h.qty * h.buyPrice;
    const curVal = cur !== null ? h.qty * cur : null;

    const pnl = curVal !== null ? curVal - invested : null;
    const pnlPct = pnl !== null ? (pnl / invested) * 100 : null;

    return `
      <tr>
        <td>
          <a href="/stock/${encodeURIComponent(h.symbol)}">${h.symbol}</a>
        </td>
        <td>${h.qty}</td>
        <td>${fmtINR(h.buyPrice)}</td>
        <td>${cur !== null ? fmtINR(cur) : "—"}</td>
        <td>${fmtINR(invested)}</td>
        <td>${curVal !== null ? fmtINR(curVal) : "—"}</td>
        <td>${fmtINR(pnl)}</td>
        <td>${fmtPct(pnlPct)}</td>
        <td>
          <button onclick="removeHolding('${h.symbol}')">X</button>
        </td>
      </tr>
    `;
  }).join("");

  content.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Stock</th>
          <th>Qty</th>
          <th>Buy</th>
          <th>Current</th>
          <th>Invested</th>
          <th>Value</th>
          <th>P&L</th>
          <th>Return</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ── Summary ─────────────────────────────────────────────
function renderSummary(portfolio) {
  let invested = 0;
  let current = 0;

  portfolio.forEach((h) => {
    invested += h.qty * h.buyPrice;

    const cur = priceCache[h.symbol];
    if (cur !== null) current += h.qty * cur;
  });

  const pnl = current - invested;

  const el1 = document.getElementById("pfTotalInvested");
  const el2 = document.getElementById("pfCurrentValue");
  const el3 = document.getElementById("pfTotalPnL");

  if (el1) el1.textContent = fmtINR(invested);
  if (el2) el2.textContent = fmtINR(current);
  if (el3) el3.textContent = fmtINR(pnl);
}

// ── Insights (safe stub) ────────────────────────────────
function renderInsights() {
  const el = document.getElementById("pfInsights");
  if (el) el.innerHTML = `<div>Insights loading...</div>`;
}

// ── Init ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderPage();
});
