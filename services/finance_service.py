"""
finance_service.py
Service layer: fetches and structures stock fundamentals + financials via yfinance.
Uses in-memory cache — no redundant API calls within the TTL window.
"""

import yfinance as yf
import pandas as pd

from utils.helpers import safe_float, pct
from cache import memory_cache


def _fmt_num(val):
    """Format a number to 2 decimal places, or return None."""
    if val is None or (isinstance(val, float) and (val != val)):
        return None
    try:
        return round(float(val), 2)
    except Exception:
        return None


def get_fundamentals(symbol: str) -> dict:
    cache_key = f"fundamentals:{symbol}"

    if memory_cache.exists(cache_key):
        cached = memory_cache.get(cache_key)
        cached["_cache"] = "HIT"
        return cached

    try:
        ticker = yf.Ticker(symbol)

        try:
            info = ticker.get_info()
        except AttributeError:
            info = ticker.info

        if not info:
            return {"error": f"No data returned for symbol '{symbol}'", "symbol": symbol}

        price = safe_float(
            info.get("currentPrice") or info.get("regularMarketPrice")
        )
        market_cap = safe_float(info.get("marketCap"))

        roe_raw = safe_float(info.get("returnOnEquity"))
        pm_raw  = safe_float(info.get("profitMargins"))
        dy_raw  = safe_float(info.get("dividendYield"))
        de_raw  = safe_float(info.get("debtToEquity"))
        rg_raw  = safe_float(info.get("revenueGrowth"))
        cr_raw  = safe_float(info.get("currentRatio"))
        eg_raw  = safe_float(info.get("earningsGrowth"))
        om_raw  = safe_float(info.get("operatingMargins"))
        roa_raw = safe_float(info.get("returnOnAssets"))

        result = {
            "symbol":           symbol,
            "name":             info.get("longName") or info.get("shortName") or symbol,
            "sector":           info.get("sector") or None,
            "industry":         info.get("industry") or None,
            "exchange":         info.get("exchange") or None,
            "currency":         info.get("currency") or "INR",
            "description":      info.get("longBusinessSummary") or None,

            "current_price":    price,

            "pe_ratio":         safe_float(info.get("trailingPE")),
            "forward_pe":       safe_float(info.get("forwardPE")),
            "peg_ratio":        safe_float(info.get("pegRatio")),
            "book_value":       safe_float(info.get("bookValue")),
            "market_cap":       market_cap,
            "market_cap_cr":    round(market_cap / 1e7, 2) if market_cap else None,

            "roe":              pct(roe_raw),
            "roa":              pct(roa_raw),
            "profit_margin":    pct(pm_raw),
            "op_margin":        pct(om_raw),
            "revenue_growth":   pct(rg_raw),
            "earnings_growth":  pct(eg_raw),

            "debt_to_equity":   de_raw,
            "current_ratio":    cr_raw,
            "dividend_yield":   pct(dy_raw),

            "week_high_52":     safe_float(info.get("fiftyTwoWeekHigh")),
            "week_low_52":      safe_float(info.get("fiftyTwoWeekLow")),

            "_raw": {
                "roe": roe_raw,
                "pm":  pm_raw,
                "dy":  dy_raw,
                "de":  de_raw,
                "rg":  rg_raw,
                "cr":  cr_raw,
            },

            "_cache": "MISS",
        }

        memory_cache.set(cache_key, result)
        return result

    except Exception as exc:
        return {"error": str(exc), "symbol": symbol}


def _df_to_table(df: pd.DataFrame, scale: float = 1e7) -> dict:
    """Convert a yfinance DataFrame to { columns, rows } format."""
    if df is None or df.empty:
        return {"columns": [], "rows": []}

    try:
        cols = [str(c.date() if hasattr(c, "date") else c) for c in df.columns]
        rows = []
        for idx, row in df.iterrows():
            values = []
            for v in row:
                if pd.isna(v):
                    values.append(None)
                else:
                    values.append(_fmt_num(float(v) / scale))
            rows.append({"label": str(idx), "values": values})
        return {"columns": cols, "rows": rows}
    except Exception:
        return {"columns": [], "rows": []}


def get_financials(symbol: str) -> dict:
    cache_key = f"financials:{symbol}"

    if memory_cache.exists(cache_key):
        cached = memory_cache.get(cache_key)
        cached["_cache"] = "HIT"
        return cached

    try:
        ticker = yf.Ticker(symbol)

        quarterly = _df_to_table(getattr(ticker, "quarterly_financials", None))
        annual    = _df_to_table(getattr(ticker, "financials", None))
        bs        = _df_to_table(getattr(ticker, "quarterly_balance_sheet", None))
        cf        = _df_to_table(getattr(ticker, "quarterly_cashflow", None))

        result = {
            "quarterly":     quarterly,
            "annual":        annual,
            "balance_sheet": bs,
            "cash_flow":     cf,
            "_cache":        "MISS",
        }

        memory_cache.set(cache_key, result)
        return result

    except Exception as exc:
        return {"error": str(exc), "symbol": symbol}
