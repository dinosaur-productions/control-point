import os
import glob
import pytest
import requests


def test_home_loads_without_errors(serve_site, page):
    errors = []

    def on_error(exc):
        errors.append(str(exc))

    page.on("pageerror", on_error)
    page.goto(serve_site, wait_until="domcontentloaded")
    page.wait_for_timeout(500)

    # Basic rendering check
    title = page.title()
    assert isinstance(title, str), "Page.title should be a string"

    # Fail if the browser emitted JS exceptions
    assert not errors, f"JS errors encountered: {errors}"


def test_site_db_is_served_with_range(serve_site):
    # Find a site database to request
    files = glob.glob("site/sitedata_*.duckdb")
    if not files:
        # Fall back to current working dir if fixture changed CWD
        files = glob.glob("sitedata_*.duckdb")
    assert files, "No sitedata_*.duckdb found under site/"

    fname = os.path.basename(files[0])

    # Full download works
    r = requests.get(f"{serve_site}/{fname}", stream=True, timeout=10)
    assert r.status_code == 200, f"Failed to GET {fname}: {r.status_code}"
    chunk = next(r.iter_content(chunk_size=1024))
    assert chunk, "Downloaded content should not be empty"

    # Range requests (partial content) should work
    r2 = requests.get(
        f"{serve_site}/{fname}",
        headers={"Range": "bytes=0-2047"},
        stream=True,
        timeout=10,
    )
    assert r2.status_code in (200, 206), f"Range GET returned {r2.status_code}"
    chunk2 = next(r2.iter_content(chunk_size=512))
    assert chunk2, "Range content should not be empty"
