"""Vercel serverless function: GET /api/autocomplete?q=tata"""
from http.server import BaseHTTPRequestHandler

try:
    from ._lib import send_json, get_query
    from ._stocks import search_stocks
except ImportError:
    from _lib import send_json, get_query
    from _stocks import search_stocks


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            q = get_query(self)
            query = (q.get("q") or "").strip()
            if not query:
                return send_json(self, [], status=200)
            return send_json(self, search_stocks(query), status=200)
        except Exception:
            return send_json(self, [], status=200)

    def do_OPTIONS(self):
        send_json(self, {}, status=200)

    def log_message(self, format, *args):
        return
