import os
import requests
import datetime as dt
from constants import DIR_DATA_DUMP, EVENT_TYPES, URL_BASE_EDGALAXYDATA
import bz2
import gzip

def get_last_modified_path(bz2_path):
    return bz2_path + ".lastmodified"

def read_last_modified(bz2_path):
    lm_path = get_last_modified_path(bz2_path)
    if os.path.exists(lm_path):
        with open(lm_path, "r") as f:
            return f.read().strip()
    return None

def write_last_modified(bz2_path, last_modified):
    lm_path = get_last_modified_path(bz2_path)
    with open(lm_path, "w") as f:
        f.write(last_modified)

def download_and_decompress_daily_file(event_type: str, date: dt.date):
    month_folder = date.strftime("%Y-%m")
    filename = f"{event_type}-{date.strftime('%Y-%m-%d')}.jsonl"
    url = f"{URL_BASE_EDGALAXYDATA}{month_folder}/{filename}.bz2"
    os.makedirs(DIR_DATA_DUMP, exist_ok=True)
    bz2_path = os.path.join(DIR_DATA_DUMP, f"{filename}.bz2")
    jsonl_path = os.path.join(DIR_DATA_DUMP, filename)

    headers = {}
    last_modified = read_last_modified(bz2_path)
    if last_modified:
        headers["If-Modified-Since"] = last_modified

    print(f"Checking {url} ...", end="")
    resp = requests.get(url, stream=True, headers=headers)
    if resp.status_code == 304:
        print(f"Not modified, skipping.")
    elif resp.status_code == 200:
        with open(bz2_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        # Save Last-Modified header if present
        last_mod = resp.headers.get("Last-Modified")
        if last_mod:
            write_last_modified(bz2_path, last_mod)
        # Decompress since we downloaded a file
        with bz2.open(bz2_path, "rb") as f_in, gzip.open(jsonl_path + ".gz", "wb") as f_out:
            for chunk in iter(lambda: f_in.read(8192), b""):
                f_out.write(chunk)
        print(f"Downloaded & recompressed.")
        # Remove the original .bz2 file
        os.remove(bz2_path)
        if os.path.exists(jsonl_path):
            os.remove(jsonl_path)
            print(f"Deleted uncompressed file {jsonl_path}")
    else:
        print(f"Failed to download: HTTP {resp.status_code}")
        return


def download_systems_populated():
    url = "https://www.edsm.net/dump/systemsPopulated.json.gz"
    filename = "systemsPopulated.json.gz"
    gz_path = os.path.join(DIR_DATA_DUMP, filename)

    def get_last_modified_path_gz(gz_path):
        return gz_path + ".lastmodified"

    def read_last_modified_gz(gz_path):
        lm_path = get_last_modified_path_gz(gz_path)
        if os.path.exists(lm_path):
            with open(lm_path, "r") as f:
                return f.read().strip()
        return None

    def write_last_modified_gz(gz_path, last_modified):
        lm_path = get_last_modified_path_gz(gz_path)
        with open(lm_path, "w") as f:
            f.write(last_modified)

    headers = {}
    last_modified = read_last_modified_gz(gz_path)
    if last_modified:
        headers["If-Modified-Since"] = last_modified

    print(f"Checking {url} ...")
    resp = requests.get(url, stream=True, headers=headers)
    if resp.status_code == 304:
        print(f"{gz_path} not modified on server, skipping download.")
    elif resp.status_code == 200:
        with open(gz_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Downloaded {filename}")
        last_mod = resp.headers.get("Last-Modified")
        if last_mod:
            write_last_modified_gz(gz_path, last_mod)
    else:
        print(f"Failed to download {filename}: HTTP {resp.status_code}")


def compress_jsonl_files_except_today():
    today_str = dt.date.today().strftime("%Y-%m-%d")
    for fname in os.listdir(DIR_DATA_DUMP):
        if fname.endswith(".jsonl") and today_str not in fname:
            jsonl_path = os.path.join(DIR_DATA_DUMP, fname)
            gz_path = jsonl_path + ".gz"
            if not os.path.exists(gz_path):
                print(f"Compressing {fname} to {gz_path}")
                with open(jsonl_path, "rb") as f_in, gzip.open(gz_path, "wb") as f_out:
                    for chunk in iter(lambda: f_in.read(8192), b""):
                        f_out.write(chunk)



def main(today, lookback_days):
    for days_ago in range(1, lookback_days):
        date = today - dt.timedelta(days=days_ago)
        for event_type in EVENT_TYPES:
            download_and_decompress_daily_file(event_type, date)
    download_systems_populated()


if __name__ == "__main__":
    main(dt.date.today(), lookback_days=2)