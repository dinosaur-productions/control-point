import datetime as dt

from constants import DB_MAIN_PATH, DB_SYSTEMS_PATH
import dl_hist
import dl_today
import import_
import compress
import report


if __name__ == "__main__":
    today = dt.date.today()
    dl_hist.main(today, lookback_days=5)
    dl_today.main(today)
    import_.main()
    compress.compress_database(DB_MAIN_PATH)
    report.make_report_db()
    compress.compress_database(DB_SYSTEMS_PATH)
