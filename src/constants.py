import datetime as dt

DIR_DATA_DUMP = 'data-dump/' 

DB_MAIN_PATH = 'data.duckdb'

SITE_DIR = "site/"

DB_SITE_NAME ="sitedata"

URL_BASE_EDGALAXYDATA = "https://edgalaxydata.space/EDDN/"
URL_EDSM_SYSTEMS_POPULATED = "https://www.edsm.net/dump/systemsPopulated.json.gz"


ODDYSSEY_RELEASE_DATE = dt.date(2021, 5, 19)
POWERPLAY2_RELEASE_DATE = dt.date(2024, 10, 22)
POWERPLAY2_VERSION = "4.0.19.0" # https://www.elitedangerous.com/update-notes/4-0-19-0

EVENT_TYPES = [
    # "CAPI.FCMaterials",
    "Commodity",                    # market info
    "Journal.ApproachSettlement",   # info about settlement when player approaches
    "Journal.CarrierJump",          # system info when a carrier jumps there
    # "Journal.CodexEntry",
    "Journal.Docked",               # info about station/any place where a player docks + available landing pads
    # "Journal.DockingDenied",      # (does not contain landing pad size info - just name of station and a bit of info)
    # "Journal.DockingGranted",     # (does not contain landing pad size info - just name of station, assigned pad number and a bit of info)
    # "Journal.FCMaterials",
    "Journal.FSDJump",              # system info when a player jumps
    # "Journal.FSSAllBodiesFound",  # just an event saying all bodies found.
    # "Journal.FSSBodySignals",     # when player discovers bodies in a system, the number and type of signals on each body. e.g. 3 biological, 3 geological. Also a single PlanetAnomly type on HIP 22460.
    # "Journal.FSSDiscoveryScan",   # "honk", just contains system + nb of bodies
    "Journal.FSSSignalDiscovered",  # zooming in on a signal using the FSS scanner. For CZs etc
    "Journal.Location",             # info about station/any place where a player is when logging in
    # "Journal.NavBeaconScan",      # only contains system + nb bodies.
    # "Journal.NavRoute",           # any nav routes plotted
    "Journal.SAASignalsFound",      # signals on planets and rings, found by the FSS. Includes hotspots.
    # "Journal.Scan",               # detailed plannet scan, contains ring - going to take this from EDSM dumps
    # "Journal.ScanBaryCentre",
    # "Outfitting",
    # "Shipyard",  
]