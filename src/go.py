import datetime as dt

import dl_hist
import dl_today
import import_


if __name__ == "__main__":
    today = dt.date.today()
    dl_hist.main(today, lookback_days=5)
    dl_today.main(today)
    import_.main()