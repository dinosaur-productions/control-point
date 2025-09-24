import datetime as dt
import os
import re

from constants import DB_MAIN_PATH, DB_SITE_NAME, DIR_DATA_DUMP, SITE_DIR
import dl_hist
import dl_today
import import_
import compress
import report
import json
import clean

def get_auto_lookback_days(data_dump_dir, today_date):
    pattern = re.compile(r'Journal\.FSDJump-(\d{4}-\d{2}-\d{2})\.jsonl\.bz2\.lastmodified$')
    latest_fsd_date = None
    for filename in os.listdir(data_dump_dir):
        match = pattern.match(filename)
        if match:
            date_str = match.group(1)
            try:
                file_date = dt.datetime.strptime(date_str, '%Y-%m-%d').date()
                if latest_fsd_date is None or file_date > latest_fsd_date:
                    latest_fsd_date = file_date
            except ValueError:
                continue  # Skip files with invalid dates
                    

    if latest_fsd_date is None:
        print("No Journal.FSDJump files found, using default 1-day lookback")
        return 1
    
    # Calculate days between today and the latest FSD file
    lookback_days = (today_date - latest_fsd_date).days
    
    # Ensure reasonable bounds
    if lookback_days < 1:
        lookback_days = 1  # At least look back 1 day
    elif lookback_days > 30:
        lookback_days = 30  # Don't go back more than 30 days
    
    print(f"Latest Journal.FSDJump file found: {latest_fsd_date}. Calculated lookback days: {lookback_days}")
    
    return lookback_days

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
    auto_lookback_days = get_auto_lookback_days(DIR_DATA_DUMP, today)
    dl_hist.main(today, lookback_days=auto_lookback_days)
    import_.main()
    compress.compress_database(DB_MAIN_PATH)
    generated_at = dt.datetime.now(dt.timezone.utc)
    db_site_path = report.make_report_db(generated_at)
    compress.compress_database(db_site_path)
    write_manifest(SITE_DIR, DB_SITE_NAME, generated_at, db_site_path)
    clean.clean_data_dump(DIR_DATA_DUMP)
