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
]

POWERPLAYSTATE = [
    "Unoccupied",
    "Exploited",
    "Fortified",
    "Stronghold",
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
]

SECURITY = [
    "Low",
    "Medium",
    "High",
    "Anarchy",
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

SERVICES = [
    "commodities",
    "bartender",
    "tuning",
    "outfitting",
    "refuel",
    "facilitator",
    "registeringcolonisation",
    "stationoperations",
    "techBroker",
    "dock",
    "flightcontroller",
    "livery",
    "frontlinesolutions",
    "repair",
    "stationMenu",
    "missionsgenerated",
    "exploration",
    "missions",
    "engineer",
    "blackmarket",
    "powerplay",
    "shipyard",
    "shop",
    "colonisationcontribution",
    "pioneersupplies",
    "crewlounge",
    "contacts",
    "apexinterstellar",
    "socialspace",
    "vistagenomics",
    "ondockmission",
    "refinery",
    "autodock",
    "rearm",
    "searchrescue",
    "materialtrader",
    "carriermanagement",
    "carrierfuel",
    "voucherredemption",
    "modulepacks",
    "carriervendor",
    "squadronBank",
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
    # Create enum types if not exist
    conn.execute(f"""
    CREATE TYPE IF NOT EXISTS power_enum AS ENUM ({', '.join(repr(p) for p in POWER)});
    CREATE TYPE IF NOT EXISTS powerplaystate_enum AS ENUM ({', '.join(repr(s) for s in POWERPLAYSTATE)});
    CREATE TYPE IF NOT EXISTS allegiance_enum AS ENUM ({', '.join(repr(a) for a in ALLEGIANCE)});
    --DROP TYPE economy_enum;
    CREATE TYPE IF NOT EXISTS economy_enum AS ENUM ({', '.join(repr(e) for e in ECONOMY)});
    CREATE TYPE IF NOT EXISTS government_enum AS ENUM ({', '.join(repr(g) for g in GOVERNMENT)});
    CREATE TYPE IF NOT EXISTS security_enum AS ENUM ({', '.join(repr(s) for s in SECURITY)});
    CREATE TYPE IF NOT EXISTS body_type_enum AS ENUM ({', '.join(repr(s) for s in BODY_TYPE)});
    CREATE TYPE IF NOT EXISTS station_type_enum AS ENUM ({', '.join(repr(s) for s in STATION_TYPE)});
    CREATE TYPE IF NOT EXISTS carrier_docking_access_enum AS ENUM ({', '.join(repr(c) for c in CARRIER_DOCKING_ACCESS)});
    --DROP TYPE service_enum;
    CREATE TYPE IF NOT EXISTS service_enum AS ENUM ({', '.join(repr(s) for s in SERVICES)});
    CREATE TYPE IF NOT EXISTS signal_type_enum AS ENUM ({', '.join(repr(s) for s in SIGNAL_TYPE)});
    CREATE TYPE IF NOT EXISTS faction_state_enum AS ENUM ({', '.join(repr(f) for f in FACTION_STATE)});
    CREATE TYPE IF NOT EXISTS happiness_enum AS ENUM ({', '.join(repr(h) for h in HAPPINESS)});
    CREATE TYPE IF NOT EXISTS commodity_bracket_enum AS ENUM ({', '.join(repr(h) for h in COMMODITY_BRACKET)});
    CREATE TYPE IF NOT EXISTS reserve_level_enum AS ENUM ({', '.join(repr(h) for h in RESERVE_LEVEL)});
    CREATE TYPE IF NOT EXISTS belt_or_ring_type_enum AS ENUM ({', '.join(repr(h) for h in BELT_OR_RING_TYPE)});
    --DROP TYPE fss_signal_type_enum;         
    CREATE TYPE IF NOT EXISTS fss_signal_type_enum AS ENUM ({', '.join(repr(h) for h in FSS_SIGNAL_TYPE)});
    """)

    conn.execute(f"""
    CREATE TYPE IF NOT EXISTS faction_detail AS STRUCT(
                Name VARCHAR, 
                Allegiance allegiance_enum,
                FactionState faction_state_enum,
                Government government_enum,
                Influence DOUBLE,
                Happiness happiness_enum,
                ActiveStates faction_state_enum[],
                RecoveringStates STRUCT(State faction_state_enum, Trend UINT8)[],
                PendingStates STRUCT(State faction_state_enum, Trend UINT8)[]);
    """)

    conn.execute(f"""
    CREATE TYPE IF NOT EXISTS conflict_side AS STRUCT(
        Name VARCHAR,
        Stake VARCHAR,
        WonDays INTEGER
    );
    """)

    conn.execute(f"""
    CREATE TYPE IF NOT EXISTS conflict_status_enum AS ENUM ({', '.join(repr(h) for h in CONFLICT_STATUS)});
    """)

    conn.execute(f"""
    CREATE TYPE IF NOT EXISTS conflict_war_type_enum AS ENUM ({', '.join(repr(h) for h in  CONFLICT_WAR_TYPE)});
    """)

    conn.execute(f"""
    CREATE TYPE IF NOT EXISTS conflict AS STRUCT(
        Faction1 conflict_side,
        Faction2 conflict_side,
        Status conflict_status_enum,
        WarType conflict_war_type_enum
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
        PowerplayState powerplaystate_enum,
        ControllingPower power_enum,
        Powers power_enum[],
        PowerplayConflictProgress STRUCT(Power power_enum, ConflictProgress DOUBLE)[],
        PowerplayStateControlProgress DOUBLE,
        PowerplayStateReinforcement INTEGER,
        PowerplayStateUndermining INTEGER,
        Factions faction_detail[],
        SystemFaction STRUCT(Name VARCHAR, FactionState faction_state_enum),
        SystemAllegiance allegiance_enum,
        SystemEconomy economy_enum,
        SystemGovernment government_enum,
        SystemSecondEconomy economy_enum,
        SystemSecurity security_enum,
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
        StationType station_type_enum,
        MarketId BIGINT PRIMARY KEY NOT NULL,
        Prohibited VARCHAR[],
        Economies STRUCT(Name economy_enum, Proportion DOUBLE)[],
        CarrierDockingAccess carrier_docking_access_enum,
        Commodities STRUCT(
            Name VARCHAR,
            BuyPrice INTEGER,
            SellPrice INTEGER,
            MeanPrice INTEGER,
            Stock INTEGER,
            StockBracket commodity_bracket_enum,
            Demand INTEGER,
            DemandBracket commodity_bracket_enum,
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
        StationAllegiance allegiance_enum,
        StationEconomies STRUCT(Name economy_enum, Proportion DOUBLE)[],
        StationEconomy economy_enum,
        StationFaction STRUCT(Name VARCHAR, FactionState faction_state_enum),
        StationGovernment government_enum,
        StationServices service_enum[]
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
        StationType station_type_enum,
        MarketId BIGINT,
        DistFromStarLS DOUBLE,
        StarPos DOUBLE[3],
        StationAllegiance allegiance_enum,
        StationEconomies STRUCT(Name economy_enum, Proportion DOUBLE)[],
        StationEconomy economy_enum,
        StationFaction STRUCT(Name VARCHAR, FactionState faction_state_enum),
        StationGovernment government_enum,
        StationServices service_enum[],
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
        BodyType body_type_enum,
        DistFromStarLS DOUBLE,
        Docked BOOLEAN,
        MarketId BIGINT,
        Population BIGINT,
        PowerplayState powerplaystate_enum,
        ControllingPower power_enum,
        Powers power_enum[],
        PowerplayConflictProgress STRUCT(Power power_enum, ConflictProgress DOUBLE)[],
        PowerplayStateControlProgress DOUBLE,
        PowerplayStateReinforcement INTEGER,
        PowerplayStateUndermining INTEGER,
        Factions faction_detail[],
        StarPos DOUBLE[3],
        StationEconomies STRUCT(Name economy_enum, Proportion DOUBLE)[],
        StationEconomy economy_enum,
        StationFaction STRUCT(Name VARCHAR, FactionState faction_state_enum),
        StationGovernment government_enum,
        StationName VARCHAR,
        StationServices service_enum[],
        StationType station_type_enum,
        SystemAllegiance allegiance_enum,
        SystemEconomy economy_enum,
        SystemFaction STRUCT(Name VARCHAR, FactionState faction_state_enum),
        SystemGovernment government_enum,
        SystemSecondEconomy economy_enum,
        SystemSecurity security_enum,
        Conflicts conflict[],
    );
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS fssbodysignals (
        timestamp TIMESTAMP NOT NULL,
        StarSystem VARCHAR,
        SystemAddress BIGINT NOT NULL,
        BodyId INTEGER,
        BodyName VARCHAR,
        Signals STRUCT(Count INTEGER, Type signal_type_enum)[],
        StarPos DOUBLE[]
    );
    """)

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
        Signals STRUCT(Count INTEGER, Type signal_type_enum)[],
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

    conn.execute("""
    CREATE OR REPLACE VIEW station_latest AS
    WITH approach_docked_loc AS (
        SELECT
            timestamp,
            StarSystem,
            SystemAddress,
            StationName,
            StationType,
            MarketId,
            DistFromStarLS,
            StarPos,
            StationAllegiance,
            StationEconomies,
            StationEconomy,
            StationFaction,
            StationGovernment,
            StationServices
        FROM docked
        UNION
        SELECT
            timestamp,
            StarSystem,
            SystemAddress,
            Name AS StationName,
            'Empty' AS StationType,
            MarketId,
            NULL AS DistFromStarLS,
            StarPos,
            StationAllegiance,
            StationEconomies,
            StationEconomy,
            StationFaction,
            StationGovernment,
            StationServices
        FROM approach_settlement
        UNION
        SELECT
            timestamp,
            StarSystem,
            SystemAddress,
            StationName,
            StationType,
            MarketId,
            DistFromStarLS,
            StarPos,
            NULL AS StationAllegiance,
            StationEconomies,
            StationEconomy,
            StationFaction,
            StationGovernment,
            StationServices
        FROM location
        WHERE Docked = TRUE
    ),
    latest AS (
        SELECT SystemAddress, StationName, MAX(timestamp) AS timestamp
        FROM approach_docked_loc
        GROUP BY ALL
    )

    SELECT DISTINCT ON (j.SystemAddress, j.StationName) j.*
    FROM approach_docked_loc j
    SEMI JOIN latest USING (SystemAddress, StationName, timestamp);
    """)

    conn.execute("""
    CREATE TYPE IF NOT EXISTS belt_or_ring AS STRUCT(
        name VARCHAR,
        type belt_or_ring_type_enum    
    );""")

    conn.execute("""
    CREATE TYPE IF NOT EXISTS body AS STRUCT(
        id64 BIGINT,
        bodyId INTEGER,
        name VARCHAR,
        type body_type_enum,       -- only Planet or Star
        subType VARCHAR,           -- null for stars
        distanceToArrival DOUBLE,
        belts belt_or_ring[],
        rings belt_or_ring[],
        reserveLevel reserve_level_enum
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
            SignalType fss_signal_type_enum
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