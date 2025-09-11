import datetime as dt

from constants import DB_MAIN_PATH, DB_SITE_PATH, DIR_DATA_DUMP
import dl_hist
import dl_today
import import_
import compress
import report
import json
import os
import clean

def write_manifest(db_path):
    manifest = {
        "generated_at": dt.datetime.now().isoformat()
    }
    manifest_path = os.path.splitext(db_path)[0] + "_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)


if __name__ == "__main__":
    today = dt.date.today()
    dl_hist.main(today, lookback_days=5)
    dl_today.main(today)
    import_.main()
    compress.compress_database(DB_MAIN_PATH)
    report.make_report_db()
    compress.compress_database(DB_SITE_PATH)
    write_manifest(DB_SITE_PATH)
    clean.clean_data_dump(DIR_DATA_DUMP)
