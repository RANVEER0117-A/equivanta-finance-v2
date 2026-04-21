import { useState, useEffect, useRef } from "react";

const PROVIDERS = [
  {
    id: "yahoo",
    label: "Yahoo Finance",
    badge: "Free · No key",
    needsKey: false,
    hint: null,
    symbolHint: "Use .NS for NSE (e.g. RELIANCE.NS) or .BO for BSE (e.g. RELIANCE.BO)",
  },
  {
    id: "alphavantage",
    label: "Alpha Vantage",
    badge: "Free · 25 req/day",
    needsKey: true,
    hint: "Get a free key at alphavantage.co",
    symbolHint: "Use BSE symbols (e.g. RELIANCE.BSE) or US symbols (e.g. AAPL)",
  },
  {
    id: "twelvedata",
    label: "Twelve Data",
    badge: "Free · 800 req/day",
    needsKey: true,
    hint: "Get a free key at twelvedata.com",
    symbolHint: "Use colon-exchange format (e.g. RELIANCE:NSE) or plain (e.g. AAPL)",
  },
];

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem("sa_settings") || "{}");
  } catch {
    return {};
  }
}

export function getApiSettings() {
  return loadSettings();
}

export default function Settings({ open, onClose }) {
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(false);
  const panelRef = useRef(null);

  const provider = PROVIDERS.find((p) => p.id === (settings.provider || "yahoo")) || PROVIDERS[0];

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function set(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem("sa_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function reset() {
    const defaults = { provider: "yahoo", apiKey: "", exchange: "NS" };
    setSettings(defaults);
    localStorage.setItem("sa_settings", JSON.stringify(defaults));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      {open && <div className="settings-backdrop" onClick={onClose} />}
      <div className={`settings-panel${open ? " open" : ""}`} ref={panelRef} role="dialog" aria-label="API Settings">
        <div className="settings-header">
          <div className="settings-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
            API Settings
          </div>
          <button className="settings-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-section">
            <label className="settings-label">Data Provider</label>
            <div className="settings-provider-list">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  className={`settings-provider-btn${(settings.provider || "yahoo") === p.id ? " active" : ""}`}
                  onClick={() => set("provider", p.id)}
                >
                  <span className="spb-label">{p.label}</span>
                  <span className="spb-badge">{p.badge}</span>
                </button>
              ))}
            </div>
            {provider.symbolHint && (
              <p className="settings-hint">{provider.symbolHint}</p>
            )}
          </div>

          {(settings.provider || "yahoo") === "yahoo" && (
            <div className="settings-section">
              <label className="settings-label">Default Exchange</label>
              <div className="settings-exchange-row">
                {[
                  { id: "NS", label: "NSE", sub: ".NS suffix" },
                  { id: "BO", label: "BSE", sub: ".BO suffix" },
                ].map((ex) => (
                  <button
                    key={ex.id}
                    className={`settings-exchange-btn${(settings.exchange || "NS") === ex.id ? " active" : ""}`}
                    onClick={() => set("exchange", ex.id)}
                  >
                    <span className="seb-label">{ex.label}</span>
                    <span className="seb-sub">{ex.sub}</span>
                  </button>
                ))}
              </div>
              <p className="settings-hint">
                When a symbol has no exchange suffix, this will be appended automatically.
              </p>
            </div>
          )}

          {provider.needsKey && (
            <div className="settings-section">
              <label className="settings-label">API Key</label>
              <input
                className="settings-input"
                type="text"
                placeholder="Enter your free API key…"
                value={settings.apiKey || ""}
                onChange={(e) => set("apiKey", e.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
              {provider.hint && (
                <p className="settings-hint">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  {provider.hint}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="settings-btn-reset" onClick={reset}>Reset</button>
          <button className="settings-btn-save" onClick={save}>
            {saved ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saved
              </>
            ) : "Save Settings"}
          </button>
        </div>
      </div>
    </>
  );
}
