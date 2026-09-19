#!/usr/bin/env python3
"""
Botly Combined Development & Live Web Scraping HTTP Server
Serves static repository assets alongside live BeautifulSoup endpoints:
- GET  /api/scrape-products?q={query}&url={siteUrl}
- POST /api/crawl (with { "url": "https://..." })
- GET  /api/health
"""

import json
import os
import sys
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import scraper


class ChatbotServerHandler(SimpleHTTPRequestHandler):
    """Combined HTTP handler for static assets and live scraping API."""

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    def _send_json(self, data: dict | list, status_code: int = 200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Handle API requests or fallback to static file serving."""
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        # 1. Health check
        if path == "/api/health":
            self._send_json({
                "status": "ok",
                "service": "botly-scraping-server",
                "engine": "beautifulsoup4_requests",
                "version": "1.0.0",
            })
            return

        # 2. Live product search scraping
        if path == "/api/scrape-products":
            query_params = urllib.parse.parse_qs(parsed_url.query)
            query = query_params.get("q", [""])[0].strip()
            site_url = query_params.get("url", [""])[0].strip() or None
            limit = 5
            if "limit" in query_params:
                try:
                    limit = int(query_params["limit"][0])
                except ValueError:
                    pass

            if not query:
                self._send_json({"found": False, "items": [], "error": "Missing 'q' query parameter"}, status_code=400)
                return

            result = scraper.scrape_products(query, site_url=site_url, max_results=limit)
            self._send_json(result)
            return

        # Fallback to serving static repository files
        super().do_GET()

    def do_POST(self):
        """Handle POST API endpoints."""
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == "/api/crawl":
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

            try:
                payload = json.loads(raw_body)
            except Exception:
                payload = dict(urllib.parse.parse_qsl(raw_body))

            url = (payload.get("url") or "").strip()
            max_pages = min(int(payload.get("max_pages", 20)), 40)

            if not url:
                self._send_json({"success": False, "error": "Missing website 'url' parameter"}, status_code=400)
                return

            result = scraper.crawl_website(url, max_pages=max_pages)
            self._send_json(result)
            return

        self._send_json({"error": f"Endpoint not found: {path}"}, status_code=404)


def run_server(port: int = 8080, host: str = "0.0.0.0"):
    # Ensure current directory is the root of the chatbot repo
    repo_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(repo_root)

    server_address = (host, port)
    httpd = HTTPServer(server_address, ChatbotServerHandler)
    print(f"🚀 Botly Combined HTTP & Scraping Server running at http://localhost:{port}/")
    print(f"   • Static Root: {repo_root}")
    print(f"   • Scraper API: http://localhost:{port}/api/scrape-products?q=milk")
    print(f"   • Crawler API: http://localhost:{port}/api/crawl")
    print(f"   • Health Check: http://localhost:{port}/api/health")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()


if __name__ == "__main__":
    port_arg = 8080
    if len(sys.argv) > 1:
        try:
            port_arg = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port=port_arg)
