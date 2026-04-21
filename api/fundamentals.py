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
                return send_json(self, data, status=200)
            return send_json(self, data, status=200)
        except Exception as e:
            return send_json(self, {"error": f"server error: {str(e)[:200]}", "symbol": ""}, status=200)

    def do_OPTIONS(self):
        send_json(self, {}, status=200)

    def log_message(self, format, *args):
        return  # silence stderr
