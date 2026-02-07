import datetime as dt
import os
import re

from constants import DB_MAIN_PATH, DIR_DATA_DUMP
import dl_hist
import dl_today
import extract
import compress
import report
import transform
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

if __name__ == "__main__":
    today = dl_today.main()
    auto_lookback_days = get_auto_lookback_days(DIR_DATA_DUMP, today)
    dl_hist.main(today, lookback_days=auto_lookback_days)
    extract.main()
    transform.main()
    # this takes a long time and doesn't do much anymore as we now do incremental updates.
    # compress.compress_database(DB_MAIN_PATH)
    generated_at = dt.datetime.now(dt.timezone.utc)
    report.make_report_db(generated_at)
    clean.clean_data_dump(DIR_DATA_DUMP)
