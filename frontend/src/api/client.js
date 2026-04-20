const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
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
