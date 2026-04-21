# EQUIVANTA FINANCE V2 — Stock Analyzer

## Overview
A full-stack Indian stock market analyzer with live fundamentals, TradingView charts, and a portfolio tracker. Styled after Screener.in with a `#00a86b` green theme and full dark mode support.

The project supports **two deployment models**:
1. **Vercel single-project** (recommended) — frontend + Python serverless functions in `/api/`
2. **Split deployment** — frontend on Vercel, FastAPI backend on Render

## Architecture

### Vercel Serverless Backend (`/api/`)
Python serverless functions using **stdlib only** (no third-party deps for fast cold starts):
- `api/_lib.py` — Yahoo Finance HTTP client (chart + crumb-authed quoteSummary), in-memory cache, JSON helpers
- `api/_stocks.py` — Curated 100+ Indian stocks list with prefix-ranked search
- `api/fundamentals.py` — `GET /api/fundamentals?symbol=RELIANCE.NS`
- `api/financials.py`  — `GET /api/financials?symbol=RELIANCE.NS`
- `api/autocomplete.py` — `GET /api/autocomplete?q=tata`
- `api/stock.py`        — `GET /api/stock?symbol=RELIANCE.NS&provider=yahoo|mock`

**All endpoints**:
- Always return valid `application/json` — never HTML
- 5-second timeout on outbound HTTP calls
- Mock fallback when Yahoo is unreachable
- Wrapped in try/except so they never crash with 500

### Local FastAPI Backend (`main.py`, port 8000)
Same endpoints exposed via FastAPI for local development:
- `services/finance_service.py` — yfinance-based fetcher with 15-min cache
- `services/autocomplete_service.py` — same stocks list
- `cache/memory_cache.py` — TTL cache
- `utils/helpers.py` — `safe_float`, `pct`

### Frontend — React + Vite (port 5000)
- `frontend/src/App.jsx` — React Router with BrowserRouter
- `frontend/src/pages/Home.jsx` — Hero search + popular stocks chips
- `frontend/src/pages/Stock.jsx` — Sticky 8-tab sub-nav, IntersectionObserver for active tab, metrics grid, TradingView chart, financial tables, ratios
- `frontend/src/pages/Portfolio.jsx` — localStorage portfolio tracker with P&L
- `frontend/src/pages/About.jsx` — Project description, supported APIs, disclaimer
- `frontend/src/components/Navbar.jsx` — Sticky navbar, autocomplete, active-nav, About link
- `frontend/src/components/Footer.jsx` — Dark `#111827` footer with Dark Mode toggle
- `frontend/src/api/client.js` — Safe fetch with 5s timeout, content-type checking, never crashes on HTML
- `frontend/src/index.css` — ~900 lines, Screener.in theme, comprehensive mobile responsive

## API Endpoints
- `GET /api/fundamentals?symbol=RELIANCE.NS` — Full fundamentals (name, sector, P/E, ROE, market cap, 52w range, etc.)
- `GET /api/financials?symbol=RELIANCE.NS`   — Quarterly/annual P&L, Balance Sheet, Cash Flow in ₹ Cr
- `GET /api/stock?symbol=RELIANCE.NS&provider=yahoo` — Quick price `{symbol, price, change, percentChange, source}`
- `GET /api/autocomplete?q=tata` — Stock search suggestions

## Running Locally
- **Backend**: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
- **Frontend**: `cd frontend && npm run dev` (Vite proxy forwards `/api/*` → :8000)

## Deployment

### Option A — Vercel (single project, recommended)
1. Push the repo to GitHub
2. Import the project on Vercel — it auto-detects `vercel.json` at the root
3. Vercel runs `cd frontend && npm install && npm run build`
4. Output served from `frontend/dist/`
5. Python files in `/api/*.py` deploy as serverless functions
6. **No env vars required** for basic operation

`vercel.json` handles:
- Build command + output directory
- SPA rewrites (all non-`/api/` paths → `/index.html`)
- 10-second function timeout

### Option B — Split (Vercel frontend + Render backend)
- Backend on Render uses `render.yaml`: `pip install -r requirements.txt` + `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Frontend on Vercel: set `VITE_API_BASE_URL` to the Render URL

## Environment Variables
- `ALLOWED_ORIGINS` (FastAPI only, optional) — comma-separated CORS origins
- `VITE_API_BASE_URL` (frontend, optional) — defaults to `/api` (works with Vercel single-project)

## Stability Guarantees
- Frontend `client.js` wraps every fetch in try/catch with `AbortController` 5-second timeout, checks `Content-Type` before parsing JSON, throws clean errors instead of crashing on the `Unexpected token '<'` JSON parse error
- All Vercel serverless functions return JSON even on failure (mock fallback for `/stock`, empty structures for `/financials`, error object for `/fundamentals`)
- Yahoo crumb auth is best-effort — if it fails, the chart endpoint still returns price + 52w range without auth

## Mobile Responsiveness
Comprehensive `@media` breakpoints at 768px and 480px:
- Hero scales down, search stays usable
- Stock sub-nav becomes horizontally scrollable (no wrapping)
- Financial + portfolio tables wrap in `overflow-x: auto` containers
- TradingView chart fixed at 320px height on mobile
- Footer + headers stack vertically
- Page-level `overflow-x: hidden` prevents accidental horizontal scroll

## Key Dependencies
- **Vercel serverless** (`/api/`): Python stdlib only — zero deps
- **Local FastAPI** (`main.py`): fastapi, uvicorn, yfinance, python-dotenv
- **Frontend**: react 18, react-router-dom v6, vite 5
