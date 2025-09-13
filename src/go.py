import datetime as dt

from constants import DB_MAIN_PATH, DB_SITE_NAME, DIR_DATA_DUMP, SITE_DIR
import dl_hist
import dl_today
import import_
import compress
import report
import json
import os
import clean

def write_manifest(site_path, db_name, generated_at, db_site_path):
    manifest = {
        "generated_at": generated_at.isoformat(),
        "db_name": os.path.basename(db_site_path),
    }
    manifest_path = os.path.join(site_path, db_name + "_manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    return generated_at


if __name__ == "__main__":
    today = dl_today.main()
    dl_hist.main(today, lookback_days=1)
    import_.main()
    compress.compress_database(DB_MAIN_PATH)
    generated_at = dt.datetime.now(dt.timezone.utc)
    db_site_path = report.make_report_db(generated_at)
    compress.compress_database(db_site_path)
    write_manifest(SITE_DIR, DB_SITE_NAME, generated_at, db_site_path)
    clean.clean_data_dump(DIR_DATA_DUMP)
