"""Vercel serverless function: GET /api/fundamentals?symbol=RELIANCE.NS"""
from http.server import BaseHTTPRequestHandler

try:
    from ._lib import send_json, get_query, get_fundamentals
except ImportError:
    from _lib import send_json, get_query, get_fundamentals


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            q = get_query(self)
            symbol = (q.get("symbol") or "").strip().upper()
            if not symbol:
                return send_json(self, {"error": "symbol is required"}, status=400)
            data = get_fundamentals(symbol)
            if "error" in data:
                err_msg = str(data["error"])
                if "429" in err_msg or "Too Many Requests" in err_msg:
                    friendly = "Yahoo Finance is rate-limiting requests. Please try again in a moment."
                elif "No data" in err_msg or "Could not fetch" in err_msg:
                    friendly = f"No data found for '{symbol}'. Check the symbol is valid (e.g. RELIANCE.NS)."
                else:
                    friendly = "Could not fetch live data from Yahoo Finance right now."
                return send_json(self, {
                    "symbol": symbol,
                    "name": symbol,
                    "_warning": friendly,
                    "_cache": "MISS",
                }, status=200)
            return send_json(self, data, status=200)
        except Exception as e:
            return send_json(self, {
                "symbol": "",
                "name": "",
                "_warning": "Could not fetch live data from Yahoo Finance right now.",
                "_cache": "MISS",
            }, status=200)

    def do_OPTIONS(self):
        send_json(self, {}, status=200)

    def log_message(self, format, *args):
        return  # silence stderr
