const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const TIMEOUT_MS = 5000;

async function apiFetch(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("Request timed out after 5 seconds");
    throw new Error(`Network error: ${err.message}`);
  }
  clearTimeout(timer);

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but got ${contentType} (status ${res.status})`);
  }

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error("Invalid JSON in response");
  }

  if (!res.ok) {
    throw new Error(json.detail || json.error || `API error ${res.status}`);
  }

  return json;
}

export function getFundamentals(symbol) {
  return apiFetch(`/fundamentals?symbol=${encodeURIComponent(symbol)}`);
}

export function getFinancials(symbol) {
  return apiFetch(`/financials?symbol=${encodeURIComponent(symbol)}`);
}

export function getAutocomplete(q) {
  return apiFetch(`/autocomplete?q=${encodeURIComponent(q)}`);
}

export function getStock(symbol, provider = "yfinance") {
  return apiFetch(`/stock?symbol=${encodeURIComponent(symbol)}&provider=${encodeURIComponent(provider)}`);
}
