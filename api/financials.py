"""Vercel serverless function: GET /api/financials?symbol=RELIANCE.NS"""
from http.server import BaseHTTPRequestHandler

try:
    from ._lib import send_json, get_query, get_financials
except ImportError:
    from _lib import send_json, get_query, get_financials


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            q = get_query(self)
            symbol = (q.get("symbol") or "").strip().upper()
            empty = {"columns": [], "rows": []}
            if not symbol:
                return send_json(self, {
                    "quarterly": empty, "annual": empty,
                    "balance_sheet": empty, "cash_flow": empty,
                }, status=200)
            data = get_financials(symbol)
            return send_json(self, data, status=200)
        except Exception as e:
            empty = {"columns": [], "rows": []}
            return send_json(self, {
                "quarterly": empty, "annual": empty,
                "balance_sheet": empty, "cash_flow": empty,
                "error": str(e)[:200],
            }, status=200)

    def do_OPTIONS(self):
        send_json(self, {}, status=200)

    def log_message(self, format, *args):
        return
