import os
import threading
import time
import socket
from http.server import ThreadingHTTPServer
from pathlib import Path

import pytest

try:
    # Range support is needed for DuckDB-WASM partial reads
    from RangeHTTPServer import RangeRequestHandler as Handler
except Exception:
    from http.server import SimpleHTTPRequestHandler as Handler


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture(scope="session")
def site_dir() -> str:
    # tests/web -> tests -> repo root
    repo_root = Path(__file__).resolve().parents[2]
    return str(repo_root / "site")


@pytest.fixture(scope="session")
def serve_site(site_dir: str):
    """Serve the site/ directory with range requests on a free port."""
    prev_cwd = os.getcwd()
    os.chdir(site_dir)
    port = _free_port()
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    base_url = f"http://127.0.0.1:{port}"
    # Give the server a moment to start
    time.sleep(0.25)
    try:
        yield base_url
    finally:
        server.shutdown()
        thread.join(timeout=2)
        os.chdir(prev_cwd)
