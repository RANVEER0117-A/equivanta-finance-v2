"""Vercel serverless function: GET /api/stock?symbol=RELIANCE.NS&provider=yahoo"""
import random
from http.server import BaseHTTPRequestHandler

try:
    from ._lib import send_json, get_query, get_quick_price, get_price_alphavantage, get_price_twelvedata
except ImportError:
    from _lib import send_json, get_query, get_quick_price, get_price_alphavantage, get_price_twelvedata


def _mock(symbol):
    rng = random.Random(sum(ord(c) for c in symbol))
    price = round(rng.uniform(100, 5000), 2)
    change = round(rng.uniform(-80, 80), 2)
    pct = round((change / price) * 100, 2)
    return {"symbol": symbol, "price": price, "change": change, "percentChange": pct, "source": "mock"}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            q = get_query(self)
            symbol = (q.get("symbol") or "").strip().upper()
            provider = (q.get("provider") or "yahoo").lower().strip()
            apikey = (q.get("apikey") or "").strip()

            if not symbol:
                return send_json(self, {
                    "error": "symbol is required",
                    "symbol": "", "price": None, "change": None,
                    "percentChange": None, "source": "none",
                }, status=400)

            if provider == "mock":
                return send_json(self, _mock(symbol), status=200)

            if provider == "alphavantage":
                if not apikey:
                    return send_json(self, {
                        "error": "An API key is required for Alpha Vantage. Get a free key at alphavantage.co.",
                        "symbol": symbol, "price": None, "change": None, "percentChange": None, "source": "none",
                    }, status=400)
                try:
                    return send_json(self, get_price_alphavantage(symbol, apikey), status=200)
                except Exception as e:
                    fallback = _mock(symbol)
                    fallback["source"] = "mock (fallback)"
                    fallback["note"] = str(e)[:120]
                    return send_json(self, fallback, status=200)

            if provider == "twelvedata":
                if not apikey:
                    return send_json(self, {
                        "error": "An API key is required for Twelve Data. Get a free key at twelvedata.com.",
                        "symbol": symbol, "price": None, "change": None, "percentChange": None, "source": "none",
                    }, status=400)
                try:
                    return send_json(self, get_price_twelvedata(symbol, apikey), status=200)
                except Exception as e:
                    fallback = _mock(symbol)
                    fallback["source"] = "mock (fallback)"
                    fallback["note"] = str(e)[:120]
                    return send_json(self, fallback, status=200)

            try:
                return send_json(self, get_quick_price(symbol), status=200)
            except Exception as e:
                fallback = _mock(symbol)
                fallback["source"] = "mock (fallback)"
                fallback["note"] = f"yahoo unavailable: {str(e)[:80]}"
                return send_json(self, fallback, status=200)

        except Exception as e:
            return send_json(self, {
                "error": str(e)[:200], "symbol": "", "price": None,
                "change": None, "percentChange": None, "source": "none",
            }, status=200)

    def do_OPTIONS(self):
        send_json(self, {}, status=200)

    def log_message(self, format, *args):
        return
