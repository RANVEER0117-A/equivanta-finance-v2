"""
EQUIVANTA FINANCE V2 — FastAPI Backend
Production-grade, modular, high-performance fintech API.
"""

import os
import asyncio
import random
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from services.finance_service import get_fundamentals, get_financials
from services.autocomplete_service import search_stocks

load_dotenv()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app = FastAPI(
    title="EQUIVANTA FINANCE V2",
    description="High-performance fintech API with caching, modular services, and optimised market data.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """Health-check endpoint."""
    return {"status": "EQUIVANTA FINANCE V2 API running", "version": "2.0.0"}


@app.get("/fundamentals", tags=["Market Data"])
def fundamentals_endpoint(
    symbol: str = Query(..., description="Yahoo Finance symbol, e.g. RELIANCE.NS or AAPL")
):
    """
    Returns key fundamentals for the given ticker symbol.
    Responses are cached in-memory for 15 minutes.
    """
    if not symbol or not symbol.strip():
        raise HTTPException(status_code=400, detail="symbol parameter is required")

    data = get_fundamentals(symbol.strip().upper())

    if "error" in data:
        raise HTTPException(status_code=502, detail=data["error"])

    return data


@app.get("/financials", tags=["Market Data"])
def financials_endpoint(
    symbol: str = Query(..., description="Yahoo Finance symbol, e.g. RELIANCE.NS")
):
    """
    Returns quarterly/annual P&L, balance sheet, and cash flow data.
    Figures are in INR Crore. Cached in-memory for 30 minutes.
    """
    if not symbol or not symbol.strip():
        raise HTTPException(status_code=400, detail="symbol parameter is required")

    data = get_financials(symbol.strip().upper())

    if "error" in data:
        return {"quarterly": {"columns": [], "rows": []}, "annual": {"columns": [], "rows": []},
                "balance_sheet": {"columns": [], "rows": []}, "cash_flow": {"columns": [], "rows": []}}

    return data


def _mock_price(symbol: str) -> dict:
    """Return deterministic fake price data for offline testing."""
    seed = sum(ord(c) for c in symbol)
    rng = random.Random(seed)
    price = round(rng.uniform(100, 5000), 2)
    change = round(rng.uniform(-80, 80), 2)
    pct = round((change / price) * 100, 2)
    return {"symbol": symbol, "price": price, "change": change, "percentChange": pct, "source": "mock"}


def _yfinance_price(symbol: str) -> dict:
    """Fetch quick price from yfinance with a 5-second timeout."""
    import yfinance as yf
    import concurrent.futures

    def _fetch():
        import math
        ticker = yf.Ticker(symbol)
        try:
            info = ticker.get_info()
        except AttributeError:
            info = ticker.info
        price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
        prev  = info.get("previousClose") or info.get("regularMarketPreviousClose")
        if price is None:
            raise ValueError("no price data")
        price = float(price)
        prev  = float(prev) if prev else price
        change = round(price - prev, 2)
        pct    = round((change / prev) * 100, 2) if prev else 0.0
        if math.isnan(price) or math.isinf(price):
            raise ValueError("invalid price")
        return {"symbol": symbol, "price": price, "change": change, "percentChange": pct, "source": "yfinance"}

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
        fut = ex.submit(_fetch)
        return fut.result(timeout=5)


@app.get("/stock", tags=["Market Data"])
def stock_endpoint(
    symbol: str = Query(..., description="Yahoo Finance symbol, e.g. RELIANCE.NS"),
    provider: str = Query("yfinance", description="Data provider: yfinance | mock"),
):
    """
    Unified quick-price endpoint. Returns {symbol, price, change, percentChange, source}.
    Always returns valid JSON — never HTML. Falls back to mock on failure.
    """
    if not symbol or not symbol.strip():
        return JSONResponse({"error": "symbol is required", "symbol": "", "price": None, "change": None, "percentChange": None, "source": "none"}, status_code=400)

    sym = symbol.strip().upper()
    prov = (provider or "yfinance").lower().strip()

    # Providers that need external API keys fall back to yfinance gracefully
    if prov == "mock":
        return _mock_price(sym)

    # yfinance is the default (and fallback for finnhub/alphavantage/twelvedata without keys)
    try:
        return _yfinance_price(sym)
    except Exception as e:
        # Last-resort: return mock so the frontend never sees an error
        result = _mock_price(sym)
        result["source"] = "mock (fallback)"
        result["note"] = f"yfinance unavailable: {str(e)[:80]}"
        return result


@app.get("/autocomplete", tags=["Search"])
def autocomplete_endpoint(
    q: str = Query(..., description="Search query — company name or symbol prefix")
):
    """
    Returns up to 10 matching Indian stocks for the given query string.
    Matches against company name and symbol.
    """
    if not q or len(q.strip()) < 1:
        return []

    results = search_stocks(q.strip())
    return results
