import datetime as dt

DIR_DATA_DUMP = 'data-dump/' 

DB_PATH = 'data.duckdb'

URL_BASE_EDGALAXYDATA = "https://edgalaxydata.space/EDDN/"
URL_EDSM_SYSTEMS_POPULATED = "https://www.edsm.net/dump/systemsPopulated.json.gz"

GAME_VERSION = [4, 1, 2, 100]

EVENT_TYPES = [
    # "CAPI.FCMaterials",
    "Commodity",
    "Journal.ApproachSettlement",
    "Journal.CarrierJump",
    # "Journal.CodexEntry",
    "Journal.Docked",
    # "Journal.DockingDenied", # landing pad size
    # "Journal.DockingGranted", # landing pad size
    # "Journal.FCMaterials",
    "Journal.FSDJump",
    # "Journal.FSSAllBodiesFound",  # just an event saying all bodies found.
    "Journal.FSSBodySignals",
    # "Journal.FSSDiscoveryScan",  # "honk", just contains system + nb of bodies
    "Journal.FSSSignalDiscovered", # TODO: zooming in on a signal using the FSS scanner. For CZs etc
    "Journal.Location",
    # "Journal.NavBeaconScan", # only contains system + nb bodies.
    # "Journal.NavRoute", # any nav routes plotted
    "Journal.SAASignalsFound",
    # "Journal.Scan", # detailed plannet scan, contains ring - going to take this from EDSM dumps
    # "Journal.ScanBaryCentre",
    # "Outfitting",
    # "Shipyard",
]