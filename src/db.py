import duckdb

from constants import DB_MAIN_PATH

POWER = [
    "Aisling Duval",
    "Archon Delaine",
    "A. Lavigny-Duval",
    "Denton Patreus",
    "Edmund Mahon",
    "Felicia Winters",
    "Li Yong-Rui",
    "Pranav Antal",
    "Yuri Grom",
    "Zemina Torval",
    "Nakato Kaine",
    "Jerome Archer",
    # PP 1.0 names added here to make old imports of unrelated data work
    "Zachary Hudson" 
]

POWERPLAYSTATE = [
    "Unoccupied",
    "Exploited",
    "Fortified",
    "Stronghold",
    # PP 1.0 values added here to make old imports of unrelated data work
    "Contested", 
    "Controlled",
    "HomeSystem",
    "InPrepareRadius",
    "Prepared",
    "Turmoil",
]

ALLEGIANCE = [
    "Alliance",
    "Thargoid",
    "Empire",
    "PilotsFederation",
    "Federation",
    "Independent",
    "Guardian",
    "None",
]

ECONOMY = [
    "Service",
    "HighTech",
    "Tourism",
    "Military",
    "Industrial",
    "Extraction",
    "Colony",
    "None",
    "Refinery",
    "Agri",
    "Terraforming",
    'Undefined', # for system second economy?
    "Carrier",
    "Rescue",
    "Prison",
    "Engineer",
    "Repair",
    "Damaged",
    "Unknown",
]

GOVERNMENT = [
    "Cooperative",
    "Communism",
    "PrisonColony",
    "Patronage",
    "None",
    "Feudal",
    "Democracy",
    "Confederacy",
    "Dictatorship",
    "Anarchy",
    "Theocracy",
    "Corporate",
    "Prison",
    "Engineer",
    "Carrier",
    "Megaconstruction",
    "Undefined",
]

SECURITY = [
    "Low",
    "Medium",
    "High",
    "Anarchy",
    "Lawless",
    "Unknown",
]

BODY_TYPE = [
    "Station",
    "AsteroidCluster",
    "Planet",
    "Star",
    "StellarRing",
    "Null",
    "PlanetaryRing",
]

STATION_TYPE = [
    "Outpost",
    "Coriolis",
    "CraterPort",
    "CraterOutpost",
    "DockablePlanetStation",
    "PlanetaryConstructionDepot",
    "Ocellus",
    "SpaceConstructionDepot",
    "FleetCarrier",
    "OnFootSettlement",
    "SurfaceStation",
    "Orbis",
    "AsteroidBase",
    "MegaShip",
    "Bernal",
    "Empty",
    "Dodec",
    "GameplayPOI"
]

CARRIER_DOCKING_ACCESS = [
    "all",
    "none",
    "friends",
    "squadron",
    "squadronfriends",
]

SIGNAL_TYPE = [
    "Biological",
    "Geological",
    "Rhodplumsite",
    "LowTemperatureDiamond",
    "Serendibite",
    "Benitoite",
    "Grandidierite",
    "Guardian",
    "Other",
    "Tritium",
    "Human",
    "PlanetAnomaly",
    "Bromellite",
    "Musgravite",
    "Opal",
    "Monazite",
    "Painite",
    "Thargoid",
    "Platinum",
    "Alexandrite"
]

FACTION_STATE = [
    "CivilLiberty",
    "Terrorism",
    "PirateAttack",
    "Boom",
    "Outbreak",
    "CivilWar",
    "Election",
    "NaturalDisaster",
    "War",
    "Lockdown",
    "Drought",
    "Expansion",
    "Blight",
    "PublicHoliday",
    "Investment",
    "InfrastructureFailure",
    "Retreat",
    "CivilUnrest",
    "Bust",
    "Famine",
    "None",
]

HAPPINESS = [
    "Elated", 
    "Happy", 
    "Discontented", 
    "Unhappy", 
    "Despondent", 
    "Unknown"
]

COMMODITY_BRACKET = [
    "None",
    "Low",
    "Med",
    "High",
]

# COMMODITY_STATUS_FLAG = [
#     "Rare",
#     "Producer",
#     "Consumer",
#     "Not Produced",
#     "Produced",
#     "Low Price",
#     "High Price",
#     "powerplay",
#     "Permit reward",
#     "Legal",
#     "High Demand",
#     "Narrative",
#     "Trailblazer Special Stock",
#     "Pub Override",
#     "AncientRelicTG price override for engineers",
#     'designer',
#     'Engineer Unlocking',
#     'cg:827', # wtf?
#     'Out of stock',
# ]

CONFLICT_STATUS = ['active', 'pending', '']

CONFLICT_WAR_TYPE = [
    'civilwar',
    'war',
    'election',
]

RESERVE_LEVEL = [
    "Pristine",
    "Depleted",
    "Common",
    "Low",
    "Major",
]

BELT_OR_RING_TYPE = [
    "Icy",
    "Rocky",
    "Metal Rich",
    "Metallic",
]

FSS_SIGNAL_TYPE = [
    "FleetCarrier",
    "NavBeacon",
    "StationONeilOrbis",
    "Generic",
    "Titan",
    "Settlement",
    "StationMegaShip",
    "Codex",
    "System",
    "StationCoriolis",
    "Megaship",
    "Outpost",
    "TouristBeacon",
    "ResourceExtraction",
    "StationAsteroid",
    "Combat",
    "POI",
    "USS",
    "StationBernalSphere",
    "StationONeilCylinder",
    "Installation",
    "ConstructionDepot",
    "Empty",
    "SquadronCarrier",
    "Port",
    "StationDodec",
]

def create_schema(conn):
    # Note: All enum validation is now done at import time via SQL error() function
    # in extract.py. No enum types are created here anymore.
    
    conn.execute(f"""
    CREATE TYPE IF NOT EXISTS faction_detail AS STRUCT(
        Name VARCHAR, 
        Allegiance VARCHAR,
        FactionState VARCHAR,
        Government VARCHAR,
        Influence DOUBLE,
        Happiness VARCHAR,
        ActiveStates VARCHAR[],
        RecoveringStates STRUCT(State VARCHAR, Trend UINT8)[],
        PendingStates STRUCT(State VARCHAR, Trend UINT8)[]);
    """)

    conn.execute(f"""
    CREATE TYPE IF NOT EXISTS conflict_side AS STRUCT(
        Name VARCHAR,
        Stake VARCHAR,
        WonDays INTEGER
    );
    """)

    conn.execute(f"""
    CREATE TYPE IF NOT EXISTS conflict AS STRUCT(
        Faction1 conflict_side,
        Faction2 conflict_side,
        Status VARCHAR,
        WarType VARCHAR
    );
    """)

    # Track imported files and last processed line for incremental import
    conn.execute("""
    CREATE TABLE IF NOT EXISTS imported_files (
        filename VARCHAR PRIMARY KEY,
        last_line INTEGER NOT NULL DEFAULT 0,
        filesize BIGINT NOT NULL,
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.execute("""
    --DROP TABLE jumps;
    --DELETE FROM imported_files WHERE filename LIKE 'Journal.FSDJump%';
    --DELETE FROM imported_files WHERE filename LIKE 'Journal.CarrierJump%';                 
    CREATE TABLE IF NOT EXISTS jumps (
        timestamp TIMESTAMP NOT NULL,
        StarSystem VARCHAR,
        SystemAddress BIGINT NOT NULL,
        Body VARCHAR,
        BodyId INTEGER,
        --BodyType body_type_enum,
        Population BIGINT,
        PowerplayState VARCHAR,  -- validates against POWERPLAYSTATE
        ControllingPower VARCHAR,  -- validates against POWER
        Powers VARCHAR[],  -- validates each against POWER
        PowerplayConflictProgress STRUCT(Power VARCHAR, ConflictProgress DOUBLE)[],
        PowerplayStateControlProgress DOUBLE,
        PowerplayStateReinforcement INTEGER,
        PowerplayStateUndermining INTEGER,
        Factions faction_detail[],
        SystemFaction STRUCT(Name VARCHAR, FactionState VARCHAR),
        SystemAllegiance VARCHAR,  -- validates against ALLEGIANCE
        SystemEconomy VARCHAR,  -- validates against ECONOMY
        SystemGovernment VARCHAR,  -- validates against GOVERNMENT
        SystemSecondEconomy VARCHAR,  -- validates against ECONOMY
        SystemSecurity VARCHAR,  -- validates against SECURITY
        StarPos DOUBLE[3],
        Conflicts conflict[],
    );
    """)

    conn.execute("""
    --DROP TABLE commodities_latest;
    --DELETE FROM imported_files WHERE filename LIKE 'Commodity-%';
    CREATE TABLE IF NOT EXISTS commodities_latest (
        timestamp TIMESTAMP NOT NULL,
        SystemName VARCHAR,
        StationName VARCHAR,
        StationType VARCHAR,  -- validates against STATION_TYPE
        MarketId BIGINT PRIMARY KEY NOT NULL,
        Prohibited VARCHAR[],
        Economies STRUCT(Name VARCHAR, Proportion DOUBLE)[],  -- Name validates against ECONOMY
        CarrierDockingAccess VARCHAR,  -- validates against CARRIER_DOCKING_ACCESS
        Commodities STRUCT(
            Name VARCHAR,
            BuyPrice INTEGER,
            SellPrice INTEGER,
            MeanPrice INTEGER,
            Stock INTEGER,
            StockBracket VARCHAR,  -- validates against COMMODITY_BRACKET
            Demand INTEGER,
            DemandBracket VARCHAR,  -- validates against COMMODITY_BRACKET
            StatusFlags VARCHAR[]
        )[]
    );
    """)

    conn.execute("""
    --DROP TABLE approach_settlement;
    --DELETE FROM imported_files WHERE filename LIKE 'Journal.ApproachSettlement%';
    CREATE TABLE IF NOT EXISTS approach_settlement (
        timestamp TIMESTAMP NOT NULL,
        StarSystem VARCHAR,
        SystemAddress BIGINT NOT NULL,
        Body VARCHAR,
        BodyId INTEGER,
        BodyName VARCHAR,
        Latitude DOUBLE,
        Longitude DOUBLE,
        MarketId BIGINT,
        Name VARCHAR NOT NULL,
        StarPos DOUBLE[3],
        StationAllegiance VARCHAR,  -- validates against ALLEGIANCE
        StationEconomies STRUCT(Name VARCHAR, Proportion DOUBLE)[],  -- Name validates against ECONOMY
        StationEconomy VARCHAR,  -- validates against ECONOMY
        StationFaction STRUCT(Name VARCHAR, FactionState VARCHAR),
        StationGovernment VARCHAR,  -- validates against GOVERNMENT
        StationServices VARCHAR[]  -- each validates against SERVICES
    );
    """)

    conn.execute("""
    --DROP TABLE docked;
    --DELETE FROM imported_files WHERE filename LIKE 'Journal.Docked%';
    CREATE TABLE IF NOT EXISTS docked (
        timestamp TIMESTAMP NOT NULL,
        StarSystem VARCHAR,
        SystemAddress BIGINT NOT NULL,
        StationName VARCHAR NOT NULL,
        StationType VARCHAR,  -- validates against STATION_TYPE
        MarketId BIGINT,
        DistFromStarLS DOUBLE,
        StarPos DOUBLE[3],
        StationAllegiance VARCHAR,  -- validates against ALLEGIANCE
        StationEconomies STRUCT(Name VARCHAR, Proportion DOUBLE)[],  -- Name validates against ECONOMY
        StationEconomy VARCHAR,  -- validates against ECONOMY
        StationFaction STRUCT(Name VARCHAR, FactionState VARCHAR),
        StationGovernment VARCHAR,  -- validates against GOVERNMENT
        StationServices VARCHAR[],  -- each validates against SERVICES
        LandingPads STRUCT(Large INTEGER, Medium INTEGER, Small INTEGER)
    );
    """)

    conn.execute("""
    --DROP TABLE location;
    --DELETE FROM imported_files WHERE filename LIKE 'Journal.Location%';
    CREATE TABLE IF NOT EXISTS location (
        timestamp TIMESTAMP NOT NULL,
        StarSystem VARCHAR,
        SystemAddress BIGINT NOT NULL,
        Body VARCHAR,
        BodyId INTEGER,
        BodyType VARCHAR,  -- validates against BODY_TYPE
        DistFromStarLS DOUBLE,
        Docked BOOLEAN,
        MarketId BIGINT,
        Population BIGINT,
        PowerplayState VARCHAR,  -- validates against POWERPLAYSTATE
        ControllingPower VARCHAR,  -- validates against POWER
        Powers VARCHAR[],  -- validates each against POWER
        PowerplayConflictProgress STRUCT(Power VARCHAR, ConflictProgress DOUBLE)[],
        PowerplayStateControlProgress DOUBLE,
        PowerplayStateReinforcement INTEGER,
        PowerplayStateUndermining INTEGER,
        Factions faction_detail[],
        StarPos DOUBLE[3],
        StationEconomies STRUCT(Name VARCHAR, Proportion DOUBLE)[],  -- Name validates against ECONOMY
        StationEconomy VARCHAR,  -- validates against ECONOMY
        StationFaction STRUCT(Name VARCHAR, FactionState VARCHAR),
        StationGovernment VARCHAR,  -- validates against GOVERNMENT
        StationName VARCHAR,
        StationServices VARCHAR[],  -- each validates against SERVICES
        StationType VARCHAR,  -- validates against STATION_TYPE
        SystemAllegiance VARCHAR,  -- validates against ALLEGIANCE
        SystemEconomy VARCHAR,  -- validates against ECONOMY
        SystemFaction STRUCT(Name VARCHAR, FactionState VARCHAR),
        SystemGovernment VARCHAR,  -- validates against GOVERNMENT
        SystemSecondEconomy VARCHAR,  -- validates against ECONOMY
        SystemSecurity VARCHAR,  -- validates against SECURITY
        Conflicts conflict[],
    );
    """)

    # conn.execute("""
    # CREATE TABLE IF NOT EXISTS fssbodysignals (
    #     timestamp TIMESTAMP NOT NULL,
    #     StarSystem VARCHAR,
    #     SystemAddress BIGINT NOT NULL,
    #     BodyId INTEGER,
    #     BodyName VARCHAR,
    #     Signals STRUCT(Count INTEGER, Type VARCHAR)[],  -- Type validates against SIGNAL_TYPE
    #     StarPos DOUBLE[]
    # );
    # """)

    conn.execute("""
    --DROP TABLE IF EXISTS saasignalsfound;
    --DELETE FROM imported_files WHERE filename LIKE 'Journal.SAASignalsFound%';
    CREATE TABLE IF NOT EXISTS saasignalsfound (
        timestamp TIMESTAMP NOT NULL,
        StarSystem VARCHAR,
        SystemAddress BIGINT NOT NULL,
        BodyId INTEGER,
        BodyName VARCHAR,
        Genuses STRUCT(Genus VARCHAR)[],
        Signals STRUCT(Count INTEGER, Type VARCHAR)[],  -- Type validates against SIGNAL_TYPE
        StarPos DOUBLE[3]
    );
    """)

    conn.execute("""
    CREATE OR REPLACE VIEW saasignalsfound_latest AS (
        SELECT DISTINCT ON (SystemAddress, BodyName) *
        FROM saasignalsfound
        ORDER BY SystemAddress, BodyName, timestamp DESC
    );
    """)

    conn.execute("""
    CREATE OR REPLACE VIEW jumps_location AS
        SELECT * FROM jumps
        UNION ALL
        SELECT 
            timestamp,
            StarSystem,
            SystemAddress,
            Body,
            BodyId,
            Population,
            PowerplayState,
            ControllingPower,
            Powers,
            PowerplayConflictProgress,
            PowerplayStateControlProgress,
            PowerplayStateReinforcement,
            PowerplayStateUndermining,
            Factions,
            SystemFaction,
            SystemAllegiance,
            SystemEconomy,
            SystemGovernment,
            SystemSecondEconomy,
            SystemSecurity,
            StarPos,
            Conflicts
        FROM location
        WHERE Docked = FALSE  
    """)


    conn.execute("""
    CREATE OR REPLACE VIEW system_latest AS
    SELECT 
        SystemAddress, 
        -- for all the "normal" columns, just take the most recent value.
        first(COLUMNS(* EXCLUDE (SystemAddress, timestamp, PowerplayStateControlProgress, PowerplayStateReinforcement, PowerplayStateUndermining)) ORDER BY timestamp DESC),
        -- some Powerplay columns may be inexplicably NULL, so we use any_value() to get the most recent non-NULL value in that case.
        any_value(COLUMNS(['PowerplayStateControlProgress', 'PowerplayStateReinforcement', 'PowerplayStateUndermining']) ORDER BY timestamp DESC),
        MAX(timestamp) AS timestamp,
        first(timestamp ORDER BY timestamp DESC) FILTER (PowerplayStateControlProgress IS NOT NULL) AS PowerplayTimestamp
    FROM jumps_location
    GROUP BY SystemAddress;
    """)

    # Note: station_latest is now a materialized table created by transform.py
    # View definition deprecated - see transform.py for materialization logic

    conn.execute("""
    CREATE TYPE IF NOT EXISTS belt_or_ring AS STRUCT(
        name VARCHAR,
        type VARCHAR  -- validates against BELT_OR_RING_TYPE
    );""")

    conn.execute("""
    CREATE TYPE IF NOT EXISTS body AS STRUCT(
        id64 BIGINT,
        bodyId INTEGER,
        name VARCHAR,
        type VARCHAR,       -- validates against BODY_TYPE (only Planet or Star)
        subType VARCHAR,           -- null for stars
        distanceToArrival DOUBLE,
        belts belt_or_ring[],
        rings belt_or_ring[],
        reserveLevel VARCHAR  -- validates against RESERVE_LEVEL
    );""")

    conn.execute("""
    --DROP TABLE IF EXISTS systems_populated;
    --DELETE FROM imported_files WHERE filename = 'systemsPopulated.json.gz';
    CREATE TABLE IF NOT EXISTS systems_populated (
        Id64 BIGINT PRIMARY KEY NOT NULL,
        Name VARCHAR,
        StarPos DOUBLE[3],
        Bodies body[]
    );""")

    conn.execute("""
    CREATE OR REPLACE MACRO system_distance(system1, system2) AS
        (WITH 
            __p1 AS (SELECT StarPos FROM systems_populated __s1 WHERE __s1.Name = system1 LIMIT 1),
            __p2 AS (SELECT StarPos FROM systems_populated __s2 WHERE __s2.Name = system2 LIMIT 1)
        SELECT array_distance(__p1.StarPos, __p2.StarPos)
        FROM __p1, __p2);
    """)

    conn.execute("""
    --DROP TABLE fsssignaldiscovered;
    --DELETE FROM imported_files WHERE filename LIKE 'Journal.FSSSignalDiscovered%';
    CREATE TABLE IF NOT EXISTS fsssignaldiscovered_latest (
        timestamp TIMESTAMP NOT NULL,
        StarSystem VARCHAR NOT NULL,
        SystemAddress BIGINT PRIMARY KEY NOT NULL,
        signals STRUCT(
            IsStation BOOLEAN,
            SignalName VARCHAR,
            SignalType VARCHAR  -- validates against FSS_SIGNAL_TYPE
        )[]
    );
    """)


def connect_db(db_path=DB_MAIN_PATH):
    return duckdb.connect(db_path)

if __name__ == "__main__":
    conn = connect_db()
    create_schema(conn)
    print(f"Schema created in {DB_MAIN_PATH}")
    conn.close()