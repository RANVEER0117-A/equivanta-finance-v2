# EQUIVANTA FINANCE V2 — Stock Analyzer

## Overview
A full-stack Indian stock market analyzer with live fundamentals, TradingView charts, and a portfolio tracker. Styled after Screener.in with a `#00a86b` green theme and full dark mode support.

## Architecture

### Backend — FastAPI (port 8000)
- `main.py` — FastAPI app, CORS middleware, route definitions
- `services/finance_service.py` — Stock data via yfinance with 15-min in-memory cache; returns `_raw` values for pros/cons logic
- `services/autocomplete_service.py` — Curated list of 100+ Indian stocks for search
- `cache/memory_cache.py` — TTL-based in-memory cache
- `utils/helpers.py` — `safe_float`, `pct` helpers (pct converts decimal → percentage float)

### Frontend — React + Vite (port 5000)
- `frontend/src/App.jsx` — React Router with BrowserRouter
- `frontend/src/pages/Home.jsx` — Hero section with pill search, feature chips, popular stocks chips
- `frontend/src/pages/Stock.jsx` — Sticky 8-tab sub-nav (Summary/Chart/About/Quarters/P&L/Balance Sheet/Cash Flow/Ratios), IntersectionObserver for active tab, company-header, metrics grid, TradingView chart, about/pros/cons, financial tables, ratios grid
- `frontend/src/pages/Portfolio.jsx` — localStorage portfolio tracker, 4 summary cards (Invested/Current/P&L/Return), autocomplete add flow, holdings table, insights section
- `frontend/src/pages/About.jsx` — Project description, how-it-works steps, API sources, features list, tech stack, legal disclaimer
- `frontend/src/components/Navbar.jsx` — Sticky navbar with live autocomplete, active-nav via useLocation, About link
- `frontend/src/components/Footer.jsx` — Dark `#111827` footer, Navigate + Indices columns, Dark Mode toggle
- `frontend/src/api/client.js` — Centralized API client (proxies /api to backend)
- `frontend/src/index.css` — ~750 lines full CSS, Screener.in-like theme, `#00a86b` green, dark mode overrides

## API Endpoints
- `GET /` — Health check
- `GET /fundamentals?symbol=RELIANCE.NS` — Key fundamentals + `_raw` values (cached 15 min)
- `GET /financials?symbol=RELIANCE.NS` — Quarterly/annual P&L, Balance Sheet, Cash Flow in ₹ Cr
- `GET /stock?symbol=RELIANCE.NS&provider=yfinance` — Unified quick-price endpoint. Providers: `yfinance` (default), `mock`. Always returns valid JSON, never HTML. Falls back to mock if yfinance fails.
- `GET /autocomplete?q=tata` — Stock search suggestions
- `GET /docs` — Swagger UI

## Design System
- Primary accent: `#00a86b` (green)
- Background: `#f2f2f2` (light), `#0d1117` (dark)
- Footer: `#111827`
- Dark mode accent: `#3fb950`
- Font: system sans-serif stack
- Portfolio key: `sa_portfolio` in localStorage

## Running Locally
- **Backend**: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
- **Frontend**: `cd frontend && npm run dev` (runs on port 5000)

## Deployment

### Backend → Render
- Uses `render.yaml`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set `ALLOWED_ORIGINS` env var to Vercel frontend URL

### Frontend → Vercel
- Build: `cd frontend && npm run build`
- Output dir: `frontend/dist`
- Uses `frontend/vercel.json` for SPA routing (all routes → index.html)
- Set `VITE_API_BASE_URL` to Render backend URL

## Environment Variables

### Backend (.env)
- `ALLOWED_ORIGINS` — Comma-separated allowed CORS origins (default: `*`)

### Frontend (.env)
- `VITE_API_BASE_URL` — Backend API base URL (default: `/api` via Vite proxy in dev)

## Key Dependencies
- **Backend**: fastapi, uvicorn, yfinance, python-dotenv
- **Frontend**: react 18, react-router-dom v6, vite 5, @vitejs/plugin-react
