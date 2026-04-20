const symbol = window.STOCK_SYMBOL;

// ── TradingView ───────────────────────────────────────────────────────────
function convertToTV(sym) {
  if (sym.endsWith(".NS")) return "NSE:" + sym.replace(".NS", "");
  if (sym.endsWith(".BO")) return "BSE:" + sym.replace(".BO", "");
  return sym;
}

function loadChart() {
  new TradingView.widget({
    autosize: true,
    symbol: convertToTV(symbol),
    interval: "D",
    timezone: "Asia/Kolkata",
    theme: "light",
    style: "1",
    locale: "en",
    toolbar_bg: "#ffffff",
    enable_publishing: false,
    allow_symbol_change: false,
    container_id: "tradingview_chart",
    hide_side_toolbar: false,
    studies: ["RSI@tv-basicstudies"],
    show_popup_button: true,
  });
}

const tvScript = document.createElement("script");
tvScript.src = "https://s3.tradingview.com/tv.js";
tvScript.onload = loadChart;
document.head.appendChild(tvScript);

// ── Utilities ─────────────────────────────────────────────────────────────
function fmtNum(val) {
  if (val === null || val === undefined) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function mkSpinner() {
  return '<div class="loading-spinner"><div class="spinner"></div></div>';
}

function noData(msg) {
  return `<div class="no-data">${msg || "Data not available"}</div>`;
}

// ── Fundamentals (key metrics + about + ratios) ───────────────────────────
async function loadFundamentals() {
  try {
    const res = await fetch(`/fundamentals?symbol=${encodeURIComponent(symbol)}`);
    const d = await res.json();
    if (d.error) return;

    // Update sub-nav + header
    document.getElementById("subnav-name").textContent = d.name || symbol;
    const priceStr = d.current_price !== "N/A" ? `₹${fmtNum(d.current_price)}` : "—";
    document.getElementById("subnav-price").textContent = priceStr;
    document.getElementById("company-name").textContent = d.name || symbol;
    document.getElementById("current-price").textContent = d.current_price !== "N/A" ? fmtNum(d.current_price) : "—";
    document.getElementById("exchange-badge").textContent = d.exchange || "NSE";
    const sectorEl = document.getElementById("company-sector");
    if (d.sector && d.sector !== "N/A") {
      sectorEl.textContent = `${d.sector} · ${d.industry}`;
    }

    // Key metrics grid
    const metrics = [
      ["Market Cap",      d.market_cap],
      ["Current Price",   d.current_price !== "N/A" ? `₹${fmtNum(d.current_price)}` : "—"],
      ["52W High",        d.week_high_52 !== "N/A" ? `₹${fmtNum(d.week_high_52)}` : "—"],
      ["52W Low",         d.week_low_52  !== "N/A" ? `₹${fmtNum(d.week_low_52)}`  : "—"],
      ["Stock P/E",       d.pe_ratio],
      ["Book Value",      d.book_value !== "N/A" ? `₹${fmtNum(d.book_value)}` : "—"],
      ["Dividend Yield",  d.dividend_yield],
      ["ROE",             d.roe],
      ["Profit Margin",   d.profit_margin],
      ["Debt / Equity",   d.debt_to_equity],
    ];

    const gridEl = document.getElementById("metrics-grid");
    gridEl.innerHTML = metrics.map(([label, val]) => `
      <div class="metric-item">
        <span class="metric-label">${label}</span>
        <span class="metric-value">${val ?? "—"}</span>
      </div>
    `).join("");

    // About section
    renderAbout(d);

    // Ratios section
    renderRatios(d);

  } catch (e) {
    console.error("Fundamentals error:", e);
  }
}

function renderAbout(d) {
  const container = document.getElementById("about-content");

  // Pros / Cons
  const pros = [], cons = [];
  const raw = d._raw || {};

  if (raw.roe > 0.20) pros.push(`Strong return on equity of ${d.roe}`);
  else if (raw.roe !== null && raw.roe < 0.10) cons.push(`Low return on equity of ${d.roe}`);

  if (raw.pm > 0.15) pros.push(`Healthy profit margins of ${d.profit_margin}`);
  else if (raw.pm !== null && raw.pm < 0.05) cons.push(`Thin profit margins of ${d.profit_margin}`);

  const pe = parseFloat(d.pe_ratio);
  if (!isNaN(pe) && pe > 0 && pe < 25) pros.push(`Reasonably valued at a P/E of ${pe}×`);
  else if (!isNaN(pe) && pe > 50) cons.push(`Expensive valuation — P/E of ${pe}×`);

  if (raw.dy > 0.025) pros.push(`Good dividend yield of ${d.dividend_yield}`);

  if (raw.de !== null && raw.de < 0.5) pros.push("Company operates with low debt");
  else if (raw.de > 2) cons.push(`High debt-to-equity ratio of ${d.debt_to_equity}`);

  if (raw.rg > 0.15) pros.push(`Strong revenue growth of ${d.revenue_growth}`);
  else if (raw.rg !== null && raw.rg < 0) cons.push(`Revenue declined ${d.revenue_growth} year-on-year`);

  if (raw.cr > 1.5) pros.push(`Healthy current ratio of ${d.current_ratio}`);
  else if (raw.cr !== null && raw.cr < 1) cons.push(`Current ratio below 1 (${d.current_ratio}) — potential liquidity risk`);

  const descHtml = d.description
    ? `<p class="company-description">${d.description.slice(0, 600)}${d.description.length > 600 ? "…" : ""}</p>`
    : `<p class="company-description" style="color:#999">No description available.</p>`;

  const swHtml = `
    <div class="sw-block">
      <div class="sw-block-title positive">Strengths</div>
      <ul class="sw-list pros">
        ${pros.length ? pros.map(p => `<li>${p}</li>`).join("") : '<li style="color:#999">No notable strengths found.</li>'}
      </ul>
    </div>
    <div class="sw-block" style="margin-top:1rem">
      <div class="sw-block-title negative">Weaknesses</div>
      <ul class="sw-list cons">
        ${cons.length ? cons.map(c => `<li>${c}</li>`).join("") : '<li style="color:#999">No notable concerns found.</li>'}
      </ul>
    </div>
  `;

  container.innerHTML = `
    <div class="about-grid">
      <div>${descHtml}</div>
      <div class="strengths-weaknesses">${swHtml}</div>
    </div>
  `;
}

function renderRatios(d) {
  const ratios = [
    { label: "P/E Ratio",         val: d.pe_ratio },
    { label: "Forward P/E",       val: d.forward_pe },
    { label: "PEG Ratio",         val: d.peg_ratio },
    { label: "Price / Book",      val: d.book_value !== "N/A" && d._raw && d.current_price !== "N/A"
        ? (parseFloat(d.current_price) / parseFloat(d.book_value)).toFixed(2)
        : "—" },
    { label: "ROE",               val: d.roe },
    { label: "ROA",               val: d.roa },
    { label: "Profit Margin",     val: d.profit_margin },
    { label: "Operating Margin",  val: d.operating_margin },
    { label: "Revenue Growth",    val: d.revenue_growth },
    { label: "Earnings Growth",   val: d.earnings_growth },
    { label: "Debt / Equity",     val: d.debt_to_equity },
    { label: "Current Ratio",     val: d.current_ratio },
  ];

  document.getElementById("ratios-content").innerHTML = `
    <div class="ratios-grid">
      ${ratios.map(r => `
        <div class="ratio-item">
          <span class="ratio-label">${r.label}</span>
          <span class="ratio-value">${r.val ?? "—"}</span>
        </div>
      `).join("")}
    </div>
  `;
}

// ── Financial tables ──────────────────────────────────────────────────────
async function loadFinancials() {
  try {
    const res = await fetch(`/financials?symbol=${encodeURIComponent(symbol)}`);
    const d = await res.json();
    if (d.error) {
      ["quarterly-table", "annual-table", "bs-table", "cf-table"]
        .forEach(id => { document.getElementById(id).innerHTML = noData("Could not load financial data."); });
      return;
    }
    renderTable("quarterly-table", d.quarterly);
    renderTable("annual-table",    d.annual);
    renderTable("bs-table",        d.balance_sheet);
    renderTable("cf-table",        d.cash_flow);
  } catch (e) {
    ["quarterly-table", "annual-table", "bs-table", "cf-table"]
      .forEach(id => { document.getElementById(id).innerHTML = noData(); });
  }
}

function renderTable(containerId, data) {
  const el = document.getElementById(containerId);
  if (!data || !data.columns || data.columns.length === 0) {
    el.innerHTML = noData();
    return;
  }

  let html = '<table class="data-table"><thead><tr><th>Item</th>';
  data.columns.forEach(col => { html += `<th>${col}</th>`; });
  html += "</tr></thead><tbody>";

  data.rows.forEach(row => {
    html += `<tr><td class="row-label">${row.label}</td>`;
    row.values.forEach(val => {
      let cls = "";
      if (val !== null && !isNaN(parseFloat(val))) {
        cls = parseFloat(val) < 0 ? "val-negative" : "";
      }
      html += `<td class="${cls}">${val !== null ? fmtNum(val) : "—"}</td>`;
    });
    html += "</tr>";
  });

  html += "</tbody></table>";
  el.innerHTML = html;
}

// ── Sticky sub-nav active tab ─────────────────────────────────────────────
function initStickyNav() {
  const sections = document.querySelectorAll(".stock-container section[id]");
  const tabs = document.querySelectorAll(".subnav-tab");
  const navbarH = 60, subnavH = 80;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tabs.forEach(t => t.classList.remove("active"));
        const active = document.querySelector(`.subnav-tab[data-section="${entry.target.id}"]`);
        if (active) active.classList.add("active");
      }
    });
  }, { rootMargin: `-${navbarH + subnavH}px 0px -60% 0px`, threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadFundamentals();
  loadFinancials();
  initStickyNav();
});
