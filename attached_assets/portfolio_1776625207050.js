const PORTFOLIO_KEY = "sa_portfolio";

// ── Storage ────────────────────────────────────────────────────────────────
function getPortfolio() {
  try { return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) || "[]"); }
  catch (_) { return []; }
}

function savePortfolio(arr) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(arr));
}

// ── Price fetching ─────────────────────────────────────────────────────────
const priceCache = {};

async function fetchPrice(symbol) {
  if (priceCache[symbol] !== undefined) return priceCache[symbol];
  try {
    const res = await fetch(`/fundamentals?symbol=${encodeURIComponent(symbol)}`);
    const d = await res.json();
    const p = parseFloat(d.current_price);
    priceCache[symbol] = isNaN(p) ? null : p;
    return priceCache[symbol];
  } catch (_) {
    priceCache[symbol] = null;
    return null;
  }
}

async function fetchAllPrices(holdings) {
  await Promise.all(holdings.map((h) => fetchPrice(h.symbol)));
}

// ── Add / Remove ───────────────────────────────────────────────────────────
let pendingStock = null;

function addHolding(symbol, name, qty, buyPrice, buyDate) {
  const portfolio = getPortfolio();
  const idx = portfolio.findIndex((h) => h.symbol === symbol);
  if (idx >= 0) {
    const existing = portfolio[idx];
    const totalQty = existing.qty + qty;
    const avgPrice = (existing.qty * existing.buyPrice + qty * buyPrice) / totalQty;
    portfolio[idx] = { ...existing, qty: totalQty, buyPrice: Math.round(avgPrice * 100) / 100 };
  } else {
    portfolio.push({ symbol, name, qty, buyPrice, buyDate: buyDate || new Date().toISOString().slice(0, 10) });
  }
  savePortfolio(portfolio);
}

function removeHolding(symbol) {
  const portfolio = getPortfolio().filter((h) => h.symbol !== symbol);
  savePortfolio(portfolio);
  delete priceCache[symbol];
  renderPage();
}

// ── Render ─────────────────────────────────────────────────────────────────
function fmtINR(val) {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return "₹" + Math.abs(val).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fmtPct(val) {
  if (val === null || isNaN(val)) return "—";
  return (val >= 0 ? "+" : "") + val.toFixed(2) + "%";
}

function renderPage() {
  const portfolio = getPortfolio();
  const content = document.getElementById("pfContent");

  if (portfolio.length === 0) {
    renderEmpty(content);
    document.getElementById("pfSummary").style.display = "none";
    document.getElementById("pfInsights").style.display = "none";
    return;
  }

  // Show loading for each row
  renderHoldingsLoading(content, portfolio);
  document.getElementById("pfSummary").style.display = "grid";

  // Fetch prices then re-render
  fetchAllPrices(portfolio).then(() => {
    renderHoldings(content, portfolio);
    renderSummary(portfolio);
    renderInsights(portfolio);
  });
}

function renderEmpty(content) {
  content.innerHTML = `
    <div class="pf-empty">
      <div class="pf-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
        </svg>
      </div>
      <h2>Your portfolio is empty</h2>
      <p>Start tracking your Indian stock investments by adding your first holding.</p>
      <button class="btn-add-primary" onclick="showAddPanel()">+ Add Your First Stock</button>
    </div>
  `;
}

function renderHoldingsLoading(content, portfolio) {
  content.innerHTML = `
    <div class="holdings-card">
      <div class="holdings-header">
        <h2 class="holdings-title">Holdings <span class="holdings-count">${portfolio.length}</span></h2>
        <button class="btn-refresh" onclick="refreshPrices()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>
      <div class="holdings-loading"><div class="spinner"></div><span>Fetching live prices…</span></div>
    </div>
  `;
}

function renderHoldings(content, portfolio) {
  const rows = portfolio.map((h) => {
    const cur = priceCache[h.symbol];
    const invested = h.qty * h.buyPrice;
    const curVal = cur !== null ? h.qty * cur : null;
    const pnl = curVal !== null ? curVal - invested : null;
    const pnlPct = pnl !== null ? (pnl / invested) * 100 : null;
    const isPos = pnl !== null && pnl >= 0;
    const cls = pnl === null ? "" : isPos ? "gain" : "loss";

    return `
      <tr>
        <td>
          <a href="/stock/${encodeURIComponent(h.symbol)}" class="holdings-link">
            <div class="h-symbol">${h.symbol.replace(/\.(NS|BO)$/, "")}</div>
            <div class="h-name">${h.name}</div>
          </a>
        </td>
        <td class="num">${h.qty}</td>
        <td class="num">${fmtINR(h.buyPrice)}</td>
        <td class="num">${cur !== null ? fmtINR(cur) : '<span class="na">—</span>'}</td>
        <td class="num">${fmtINR(invested)}</td>
        <td class="num">${curVal !== null ? fmtINR(curVal) : '<span class="na">—</span>'}</td>
        <td class="num ${cls}">${pnl !== null ? (pnl >= 0 ? "+" : "") + fmtINR(pnl).slice(1) : '<span class="na">—</span>'}</td>
        <td class="num ${cls}">${fmtPct(pnlPct)}</td>
        <td>
          <button class="btn-remove" onclick="removeHolding('${h.symbol}')" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  content.innerHTML = `
    <div class="holdings-card">
      <div class="holdings-header">
        <h2 class="holdings-title">Holdings <span class="holdings-count">${portfolio.length}</span></h2>
        <button class="btn-refresh" onclick="refreshPrices()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh Prices
        </button>
      </div>
      <div class="holdings-table-wrap">
        <table class="holdings-table">
          <thead>
            <tr>
              <th>Stock</th>
              <th class="num">Qty</th>
              <th class="num">Avg Buy</th>
              <th class="num">Current</th>
              <th class="num">Invested</th>
              <th class="num">Value</th>
              <th class="num">P&amp;L (₹)</th>
              <th class="num">Return</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSummary(portfolio) {
  let totalInvested = 0, currentValue = 0, hasPrice = false;
  portfolio.forEach((h) => {
    totalInvested += h.qty * h.buyPrice;
    const cur = priceCache[h.symbol];
    if (cur !== null) { currentValue += h.qty * cur; hasPrice = true; }
  });

  const pnl = hasPrice ? currentValue - totalInvested : null;
  const pnlPct = pnl !== null && totalInvested > 0 ? (pnl / totalInvested) * 100 : null;
  const isPos = pnl === null || pnl >= 0;

  document.getElementById("pfTotalInvested").textContent  = fmtINR(totalInvested);
  document.getElementById("pfCurrentValue").textContent   = hasPrice ? fmtINR(currentValue) : "—";
  document.getElementById("pfTotalPnL").textContent       = pnl !== null ? (pnl >= 0 ? "+" : "") + fmtINR(pnl).slice(1) : "—";
  document.getElementById("pfReturn").textContent         = fmtPct(pnlPct);

  const pnlEl  = document.getElementById("pfTotalPnL");
  const retEl  = document.getElementById("pfReturn");
  [pnlEl, retEl].forEach((el) => {
    el.className = "pf-card-value " + (pnl === null ? "" : isPos ? "gain" : "loss");
  });
}

function renderInsights(portfolio) {
  const ins = document.getElementById("pfInsights");
  if (portfolio.length < 1) { ins.style.display = "none"; return; }

  const withPrices = portfolio
    .map((h) => {
      const cur = priceCache[h.symbol];
      if (cur === null) return null;
      const pnlPct = ((cur - h.buyPrice) / h.buyPrice) * 100;
      const curVal = h.qty * cur;
      return { ...h, cur, pnlPct, curVal };
    })
    .filter(Boolean);

  if (withPrices.length === 0) { ins.style.display = "none"; return; }

  const best  = withPrices.reduce((a, b) => (a.pnlPct > b.pnlPct ? a : b));
  const worst = withPrices.reduce((a, b) => (a.pnlPct < b.pnlPct ? a : b));
  const totalCurVal = withPrices.reduce((s, h) => s + h.curVal, 0);

  // Allocation bars
  const sorted = [...withPrices].sort((a, b) => b.curVal - a.curVal).slice(0, 5);
  const allocHtml = sorted.map((h) => {
    const pct = totalCurVal > 0 ? (h.curVal / totalCurVal) * 100 : 0;
    return `
      <div class="alloc-row">
        <span class="alloc-sym">${h.symbol.replace(/\.(NS|BO)$/, "")}</span>
        <div class="alloc-bar-wrap">
          <div class="alloc-bar" style="width:${pct.toFixed(1)}%"></div>
        </div>
        <span class="alloc-pct">${pct.toFixed(1)}%</span>
      </div>
    `;
  }).join("");

  ins.style.display = "grid";
  document.getElementById("pfBestName").textContent    = best.name;
  document.getElementById("pfBestReturn").textContent  = fmtPct(best.pnlPct);
  document.getElementById("pfBestReturn").className    = "insight-val " + (best.pnlPct >= 0 ? "gain" : "loss");
  document.getElementById("pfWorstName").textContent   = worst.name;
  document.getElementById("pfWorstReturn").textContent = fmtPct(worst.pnlPct);
  document.getElementById("pfWorstReturn").className   = "insight-val " + (worst.pnlPct >= 0 ? "gain" : "loss");
  document.getElementById("pfAlloc").innerHTML         = allocHtml;
}

// ── Refresh ────────────────────────────────────────────────────────────────
function refreshPrices() {
  Object.keys(priceCache).forEach((k) => delete priceCache[k]);
  renderPage();
}

// ── Add panel ──────────────────────────────────────────────────────────────
function showAddPanel() {
  document.getElementById("addPanel").classList.add("visible");
  document.getElementById("addSearchInput").focus();
}

function toggleAddPanel() {
  const panel = document.getElementById("addPanel");
  panel.classList.toggle("visible");
  if (panel.classList.contains("visible")) {
    document.getElementById("addSearchInput").focus();
  }
}

function cancelAdd() {
  pendingStock = null;
  document.getElementById("addSearchInput").value = "";
  document.getElementById("addSearchDropdown").classList.remove("show");
  document.getElementById("addDetails").style.display = "none";
  document.getElementById("addPanel").classList.remove("visible");
}

function confirmAddStock() {
  if (!pendingStock) return;
  const qty = parseFloat(document.getElementById("addQty").value);
  const buyPrice = parseFloat(document.getElementById("addBuyPrice").value);
  const buyDate = document.getElementById("addBuyDate").value;

  if (isNaN(qty) || qty <= 0) { alert("Please enter a valid quantity."); return; }
  if (isNaN(buyPrice) || buyPrice <= 0) { alert("Please enter a valid buy price."); return; }

  addHolding(pendingStock.symbol, pendingStock.name, qty, buyPrice, buyDate);
  cancelAdd();
  renderPage();
}

// Add search
let addTimer;
function initAddSearch() {
  const input = document.getElementById("addSearchInput");
  const dropdown = document.getElementById("addSearchDropdown");
  if (!input) return;

  input.addEventListener("input", () => {
    clearTimeout(addTimer);
    const q = input.value.trim();
    if (q.length < 2) { dropdown.classList.remove("show"); return; }
    addTimer = setTimeout(() => fetchAddSuggestions(q, dropdown), 260);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".add-search-wrap")) dropdown.classList.remove("show");
  });
}

async function fetchAddSuggestions(q, dropdown) {
  try {
    const res = await fetch(`/autocomplete?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    renderAddDropdown(data, dropdown);
  } catch (_) { dropdown.classList.remove("show"); }
}

function renderAddDropdown(results, dropdown) {
  dropdown.innerHTML = "";
  if (!results || results.length === 0) {
    dropdown.innerHTML = '<div class="add-ac-empty">No results</div>';
    dropdown.classList.add("show");
    return;
  }
  results.forEach((item) => {
    const div = document.createElement("div");
    div.className = "add-ac-item";
    div.innerHTML = `<span>${item.name}</span><span class="add-ac-sym">${item.symbol}</span>`;
    div.addEventListener("click", () => {
      pendingStock = item;
      document.getElementById("addSearchInput").value = item.name;
      dropdown.classList.remove("show");
      document.getElementById("addDetails").style.display = "block";
      document.getElementById("addQty").focus();
    });
    dropdown.appendChild(div);
  });
  dropdown.classList.add("show");
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initAddSearch();
  renderPage();
});
