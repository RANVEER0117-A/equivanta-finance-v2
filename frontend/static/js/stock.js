const API_BASE = "http://127.0.0.1:8000";

// ── Get symbol from URL (/stock/INFY.NS) ───────────────
const pathParts = window.location.pathname.split("/");
const symbol = decodeURIComponent(pathParts[pathParts.length - 1]);

if (!symbol || symbol === "stock") {
  document.body.innerHTML = "<h2>No stock selected</h2>";
  throw new Error("No symbol provided");
}

const container = document.getElementById("stockContainer");

// ── Load data ───────────────────────────────────────────
async function loadStock() {
  try {
    const res = await fetch(
      `${API_BASE}/fundamentals?symbol=${encodeURIComponent(symbol)}`
    );

    if (!res.ok) throw new Error("API error");

    const data = await res.json();
    renderStock(data);

  } catch (err) {
    console.error(err);
    if (container) {
      container.innerHTML = "<h2>Failed to load stock data</h2>";
    }
  }
}

// ── Safe formatter ───────────────────────────────────────
function safe(val, fallback = "N/A") {
  return val === null || val === undefined || val === "" ? fallback : val;
}

// ── Render UI ───────────────────────────────────────────
function renderStock(data) {
  if (!container) return;

  container.innerHTML = `
    <div class="stock-header">
      <h1>${safe(data.name)} (${safe(data.symbol)})</h1>
    </div>

    <div class="stock-grid">
      <div class="card">💰 Price: ₹${safe(data.current_price)}</div>
      <div class="card">📊 PE: ${safe(data.pe_ratio)}</div>
      <div class="card">🏦 Market Cap: ${safe(data.market_cap)}</div>
      <div class="card">📈 52W High: ${safe(data.week_high_52)}</div>
      <div class="card">📉 52W Low: ${safe(data.week_low_52)}</div>
      <div class="card">💸 Dividend Yield: ${safe(data.dividend_yield)}</div>
      <div class="card">📊 ROE: ${safe(data.roe)}</div>
      <div class="card">📊 ROA: ${safe(data.roa)}</div>
    </div>
  `;
}

// ── init ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadStock);
