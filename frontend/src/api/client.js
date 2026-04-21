const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const TIMEOUT_MS = 8000;

function getSettings() {
  try {
    return JSON.parse(localStorage.getItem("sa_settings") || "{}");
  } catch {
    return {};
  }
}

function resolveSymbol(symbol) {
  const s = getSettings();
  const provider = s.provider || "yahoo";
  if (provider === "yahoo") {
    const hasSuffix = symbol.includes(".") || symbol.startsWith("^");
    if (!hasSuffix) {
      const exchange = s.exchange || "NS";
      return symbol + "." + exchange;
    }
  }
  return symbol;
}

function providerParams() {
  const s = getSettings();
  const params = new URLSearchParams();
  const provider = s.provider || "yahoo";
  if (provider !== "yahoo") params.set("provider", provider);
  if (s.apiKey) params.set("apikey", s.apiKey);
  return params.toString();
}

async function apiFetch(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("Request timed out. The data provider may be slow.");
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
  const resolved = resolveSymbol(symbol);
  return apiFetch(`/fundamentals?symbol=${encodeURIComponent(resolved)}`);
}

export function getFinancials(symbol) {
  const resolved = resolveSymbol(symbol);
  return apiFetch(`/financials?symbol=${encodeURIComponent(resolved)}`);
}

export function getAutocomplete(q) {
  return apiFetch(`/autocomplete?q=${encodeURIComponent(q)}`);
}

export function getStock(symbol, provider) {
  const resolved = resolveSymbol(symbol);
  const extra = providerParams();
  const base = `/stock?symbol=${encodeURIComponent(resolved)}`;
  return apiFetch(extra ? `${base}&${extra}` : base);
}
