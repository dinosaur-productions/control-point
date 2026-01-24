from http.server import HTTPServer
from RangeHTTPServer import RangeRequestHandler
import argparse
from functools import partial

class CORSRangeRequestHandler(RangeRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization')
        # Disable caching for development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.end_headers()

    def guess_type(self, path):
        if path.endswith(".duckdb"):
            return "application/octet-stream"
        return super().guess_type(path)

def main():
    parser = argparse.ArgumentParser(description="Start a RangeHTTPServer with CORS enabled.")
    parser.add_argument('--bind', '-b', default='0.0.0.0', help='Bind address (default: 0.0.0.0)')
    parser.add_argument('--port', '-p', type=int, default=8000, help='Port (default: 8000)')
    parser.add_argument('--directory', '-d', default='.', help='Directory to serve (default: current directory)')
    args = parser.parse_args()

    handler_class = partial(CORSRangeRequestHandler, directory=args.directory)

    server = HTTPServer((args.bind, args.port), handler_class)
    print(f"Serving HTTP with Range and CORS on {args.bind}:{args.port}, directory: {args.directory}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()

if __name__ == '__main__':
    main()