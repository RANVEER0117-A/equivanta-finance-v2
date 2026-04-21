"""
Shared library for Vercel serverless functions.
Uses Python stdlib only — no third-party deps — for fast cold starts.
"""

import json
import urllib.request
import urllib.parse
import http.cookiejar
import socket

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
TIMEOUT = 5

# Per-cold-start cache for crumb auth + lightweight in-memory cache
_CRUMB = {"value": None, "cookies": None}
_CACHE = {}  # { key: (timestamp, data) }
_CACHE_TTL = 600  # 10 minutes

import time


def cache_get(key):
    item = _CACHE.get(key)
    if item and (time.time() - item[0]) < _CACHE_TTL:
        return item[1]
    return None


def cache_set(key, value):
    _CACHE[key] = (time.time(), value)


def send_json(handler, data, status=200):
    """Always send valid JSON, never HTML. Adds CORS headers."""
    payload = json.dumps(data, default=str).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "*")
    handler.send_header("Cache-Control", "public, max-age=300")
    handler.send_header("Content-Length", str(len(payload)))
    handler.end_headers()
    handler.wfile.write(payload)


def get_query(handler):
    """Parse query string from request path."""
    parsed = urllib.parse.urlparse(handler.path)
    return {k: v[0] for k, v in urllib.parse.parse_qs(parsed.query).items()}


def safe_float(v):
    if v is None:
        return None
    try:
        f = float(v)
        if f != f or f in (float("inf"), float("-inf")):
            return None
        return f
    except (TypeError, ValueError):
        return None


def pct(v, decimals=2):
    f = safe_float(v)
    if f is None:
        return None
    return round(f * 100, decimals)


def _http_get(url, cookies=None):
    """GET a URL with timeout. Returns (status, body_bytes)."""
    if cookies is not None:
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
    else:
        opener = urllib.request.build_opener()
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with opener.open(req, timeout=TIMEOUT) as r:
        return r.status, r.read()


def _get_crumb():
    """Get Yahoo crumb + cookies needed for quoteSummary endpoint."""
    if _CRUMB["value"]:
        return _CRUMB["value"], _CRUMB["cookies"]
    try:
        cj = http.cookiejar.CookieJar()
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
        # Step 1: hit fc.yahoo.com to set cookies
        req1 = urllib.request.Request("https://fc.yahoo.com/", headers={"User-Agent": UA})
        try:
            opener.open(req1, timeout=TIMEOUT)
        except Exception:
            pass
        # Step 2: get crumb
        req2 = urllib.request.Request(
            "https://query1.finance.yahoo.com/v1/test/getcrumb",
            headers={"User-Agent": UA, "Accept": "*/*"},
        )
        with opener.open(req2, timeout=TIMEOUT) as r:
            crumb = r.read().decode("utf-8").strip()
        if crumb and "<" not in crumb and len(crumb) < 64:
            _CRUMB["value"] = crumb
            _CRUMB["cookies"] = cj
            return crumb, cj
    except Exception:
        pass
    return None, None


def yahoo_chart(symbol, range_="1y", interval="1d"):
    """Public Yahoo chart endpoint — no auth needed."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(symbol)}?range={range_}&interval={interval}"
    _, body = _http_get(url)
    return json.loads(body)


def yahoo_quote_summary(symbol, modules):
    """Yahoo quoteSummary endpoint with crumb auth. Returns None on failure."""
    crumb, cj = _get_crumb()
    if not crumb:
        return None
    try:
        url = (
            f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/"
            f"{urllib.parse.quote(symbol)}?modules={','.join(modules)}&crumb={urllib.parse.quote(crumb)}"
        )
        _, body = _http_get(url, cookies=cj)
        return json.loads(body)
    except Exception:
        return None


def _v(node, key):
    """Extract a numeric value from a Yahoo quoteSummary field (which can be {raw: N} or N)."""
    if not node:
        return None
    obj = node.get(key)
    if isinstance(obj, dict):
        return obj.get("raw")
    if isinstance(obj, (int, float)):
        return obj
    return None


def get_fundamentals(symbol):
    """Build a fundamentals payload that matches the existing frontend contract."""
    cache_key = f"fund:{symbol}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    # Step 1 — chart endpoint (always works, no auth)
    try:
        chart = yahoo_chart(symbol)
        meta = chart["chart"]["result"][0]["meta"]
    except Exception as e:
        return {"error": f"Could not fetch data for '{symbol}': {str(e)[:120]}", "symbol": symbol}

    price = safe_float(meta.get("regularMarketPrice"))
    prev_close = safe_float(meta.get("chartPreviousClose") or meta.get("previousClose"))

    result = {
        "symbol":          symbol,
        "name":            meta.get("longName") or meta.get("shortName") or symbol,
        "exchange":        meta.get("exchangeName") or meta.get("fullExchangeName"),
        "currency":        meta.get("currency", "INR"),
        "current_price":   price,
        "previous_close":  prev_close,
        "week_high_52":    safe_float(meta.get("fiftyTwoWeekHigh")),
        "week_low_52":     safe_float(meta.get("fiftyTwoWeekLow")),
        "sector":          None, "industry": None, "description": None,
        "pe_ratio":        None, "forward_pe": None, "peg_ratio": None,
        "book_value":      None, "market_cap": None, "market_cap_cr": None,
        "roe":             None, "roa": None,
        "profit_margin":   None, "op_margin": None,
        "revenue_growth":  None, "earnings_growth": None,
        "debt_to_equity":  None, "current_ratio": None, "dividend_yield": None,
        "_raw":            {"roe": None, "pm": None, "dy": None, "de": None, "rg": None, "cr": None},
    }

    # Step 2 — try to enrich with quoteSummary (best effort)
    try:
        qs = yahoo_quote_summary(symbol, [
            "summaryDetail", "financialData", "defaultKeyStatistics",
            "summaryProfile", "assetProfile",
        ])
        if qs and qs.get("quoteSummary", {}).get("result"):
            r = qs["quoteSummary"]["result"][0]
            sd = r.get("summaryDetail") or {}
            fd = r.get("financialData") or {}
            ks = r.get("defaultKeyStatistics") or {}
            sp = r.get("summaryProfile") or r.get("assetProfile") or {}

            result["sector"] = sp.get("sector")
            result["industry"] = sp.get("industry")
            result["description"] = sp.get("longBusinessSummary")

            mc = _v(sd, "marketCap")
            result["market_cap"] = mc
            result["market_cap_cr"] = round(mc / 1e7, 2) if mc else None

            result["pe_ratio"]    = _v(sd, "trailingPE")
            result["forward_pe"]  = _v(sd, "forwardPE")
            result["peg_ratio"]   = _v(ks, "pegRatio") or _v(ks, "trailingPegRatio")
            result["book_value"]  = _v(ks, "bookValue")

            roe = _v(fd, "returnOnEquity")
            roa = _v(fd, "returnOnAssets")
            pm  = _v(fd, "profitMargins")
            om  = _v(fd, "operatingMargins")
            rg  = _v(fd, "revenueGrowth")
            eg  = _v(fd, "earningsGrowth")
            de  = _v(fd, "debtToEquity")
            cr  = _v(fd, "currentRatio")
            dy  = _v(sd, "dividendYield")

            result["roe"]             = pct(roe)
            result["roa"]             = pct(roa)
            result["profit_margin"]   = pct(pm)
            result["op_margin"]       = pct(om)
            result["revenue_growth"]  = pct(rg)
            result["earnings_growth"] = pct(eg)
            result["debt_to_equity"]  = de
            result["current_ratio"]   = cr
            result["dividend_yield"]  = pct(dy)
            result["_raw"] = {"roe": roe, "pm": pm, "dy": dy, "de": de, "rg": rg, "cr": cr}
    except Exception:
        pass  # gracefully degrade

    cache_set(cache_key, result)
    return result


def get_quick_price(symbol):
    """Lightweight price/change response for the unified /stock endpoint."""
    chart = yahoo_chart(symbol)
    meta = chart["chart"]["result"][0]["meta"]
    price = safe_float(meta.get("regularMarketPrice"))
    prev = safe_float(meta.get("chartPreviousClose") or meta.get("previousClose")) or price
    if price is None:
        raise ValueError("no price data")
    change = round(price - prev, 2) if prev else 0.0
    pct_change = round((change / prev) * 100, 2) if prev else 0.0
    return {
        "symbol": symbol,
        "price": price,
        "change": change,
        "percentChange": pct_change,
        "source": "yahoo",
    }


def get_financials(symbol):
    """
    Financial tables (P&L / BS / CF) require quoteSummary auth.
    Returns empty structure when unavailable so the UI never breaks.
    """
    empty = {"columns": [], "rows": []}
    out = {"quarterly": empty, "annual": empty, "balance_sheet": empty, "cash_flow": empty}

    try:
        qs = yahoo_quote_summary(symbol, [
            "incomeStatementHistory", "incomeStatementHistoryQuarterly",
            "balanceSheetHistory", "cashflowStatementHistory",
        ])
        if not qs or not qs.get("quoteSummary", {}).get("result"):
            return out
        r = qs["quoteSummary"]["result"][0]

        def _build(stmts, fields):
            if not stmts:
                return empty
            cols = []
            for s in stmts:
                d = s.get("endDate", {}).get("fmt") or s.get("endDate", {}).get("raw")
                cols.append(str(d) if d else "")
            rows = []
            for label, key in fields:
                row_vals = []
                for s in stmts:
                    v = s.get(key, {}).get("raw") if isinstance(s.get(key), dict) else None
                    row_vals.append(round(v / 1e7, 2) if v is not None else None)
                rows.append({"label": label, "values": row_vals})
            return {"columns": cols, "rows": rows}

        income_fields = [
            ("Revenue", "totalRevenue"), ("Cost of Revenue", "costOfRevenue"),
            ("Gross Profit", "grossProfit"), ("Operating Income", "operatingIncome"),
            ("Net Income", "netIncome"),
        ]
        bs_fields = [
            ("Total Assets", "totalAssets"), ("Total Liabilities", "totalLiab"),
            ("Total Equity", "totalStockholderEquity"), ("Cash", "cash"),
            ("Long Term Debt", "longTermDebt"),
        ]
        cf_fields = [
            ("Operating Cash Flow", "totalCashFromOperatingActivities"),
            ("Investing Cash Flow", "totalCashflowsFromInvestingActivities"),
            ("Financing Cash Flow", "totalCashFromFinancingActivities"),
            ("Net Change in Cash", "changeInCash"),
        ]

        annual = (r.get("incomeStatementHistory") or {}).get("incomeStatementHistory") or []
        quarterly = (r.get("incomeStatementHistoryQuarterly") or {}).get("incomeStatementHistory") or []
        bs = (r.get("balanceSheetHistory") or {}).get("balanceSheetStatements") or []
        cf = (r.get("cashflowStatementHistory") or {}).get("cashflowStatements") or []

        out["quarterly"]     = _build(quarterly, income_fields)
        out["annual"]        = _build(annual, income_fields)
        out["balance_sheet"] = _build(bs, bs_fields)
        out["cash_flow"]     = _build(cf, cf_fields)
    except Exception:
        pass

    return out
