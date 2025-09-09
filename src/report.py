import duckdb
import os

from constants import DB_SITE_PATH



def make_report_db():
    if os.path.exists(DB_SITE_PATH):
        os.remove(DB_SITE_PATH)
    print(f"Creating report database at {DB_SITE_PATH} ...", end="")
    conn = duckdb.connect(DB_SITE_PATH)
    conn.execute("ATTACH 'data.duckdb' as db (READ_ONLY);")
    conn.execute("""
        CREATE OR REPLACE TYPE activity_enum AS ENUM ('Acquire', 'Reinforce', 'Undermine', 'Out of Range', 'Wait Until Next Cycle');
        CREATE OR REPLACE TABLE systems AS
            WITH 
            populated AS (
                SELECT 
                    sys.*,
                    pp.* EXCLUDE (SystemAddress, StarSystem, StarPos, PowerplayState, Powers),
                    COALESCE(PowerplayState, 'Unoccupied') AS PowerplayState, 
                    COALESCE(Powers, []) AS Powers,
                    (pp.SystemAddress IS NOT NULL) AS HasPowerplayData,
                FROM db.systems_populated sys
                LEFT JOIN db.system_latest pp ON pp.SystemAddress = sys.Id64
            ),
            activities AS (
                SELECT 
                    Id64 AS SystemAddress,
                    Name AS StarSystem,
                    StarPos,
                    ControllingPower,
                    PowerplayState, 
                    CASE 
                        WHEN PowerplayStateControlProgress > 12000 
                            -- control lost, journal has weird number like 12271.nnn
                            THEN (PowerplayStateReinforcement - PowerplayStateUndermining) / 120000.0
                        ELSE
                            PowerplayStateControlProgress
                    END AS PowerplayStateControlProgress,
                    Powers,
                    PowerplayStateReinforcement, 
                    PowerplayStateUndermining, 
                    PowerplayConflictProgress,
                    CASE 
                        WHEN ControllingPower = 'Li Yong-Rui' THEN 'Reinforce'
                        ELSE
                            CASE
                                WHEN PowerplayState = 'Unoccupied' AND 'Li Yong-Rui' IN Powers THEN 'Acquire'
                                WHEN PowerplayState = 'Unoccupied' THEN 'Out of Range'
                                ELSE 'Undermine'
                            END
                    END::activity_enum AS Activity,
                    timestamp as LastUpdate,
                FROM populated
                WHERE HasPowerplayData
            )
            SELECT * FROM activities
            WHERE Activity NOT IN ('No Powerplay Data');
    """)
    conn.execute("""
        CREATE OR REPLACE TABLE powerplay_support AS
        WITH
        populated AS (
            SELECT 
                pp.* EXCLUDE (PowerplayState, Powers),
                COALESCE(PowerplayState, 'Unoccupied') AS PowerplayState, 
                COALESCE(Powers, []) AS Powers,
            FROM db.system_latest pp 
            WHERE Population > 0
        ),
        supporting AS (
            SELECT *, CASE WHEN PowerplayState = 'Stronghold' THEN 30 ELSE 20 END AS MaxDistance
            FROM populated
            WHERE ControllingPower = 'Li Yong-Rui'
            AND PowerplayState IN ('Stronghold', 'Fortified')
        ),
        supported AS (
            SELECT *
            FROM populated
            WHERE  'Li Yong-Rui' IN Powers
            AND PowerplayState IN ('Exploited', 'Unoccupied')
        )

        SELECT
            t1.SystemAddress as SupportingSystemAddress,
            t2.SystemAddress as SupportedSystemAddress,
            SQRT(
                POW(t2.StarPos[1] - t1.StarPos[1], 2) +
                POW(t2.StarPos[2] - t1.StarPos[2], 2) +
                POW(t2.StarPos[3] - t1.StarPos[3], 2)
            ) AS Distance
        FROM supporting AS t1
        JOIN supported AS t2 
            ON SQRT(
                POW(t2.StarPos[1] - t1.StarPos[1], 2) +
                POW(t2.StarPos[2] - t1.StarPos[2], 2) +
                POW(t2.StarPos[3] - t1.StarPos[3], 2)
            )  <= t1.MaxDistance;
    """)
    conn.execute("""
    CREATE OR REPLACE MACRO system_distance(system1, system2) AS
        (WITH 
            __p1 AS (SELECT StarPos FROM systems WHERE StarSystem = system1 LIMIT 1),
            __p2 AS (SELECT StarPos FROM systems WHERE StarSystem = system2 LIMIT 1)
        SELECT array_distance(__p1.StarPos, __p2.StarPos)
        FROM __p1, __p2);
    """)
    conn.execute("""
    CREATE OR REPLACE MACRO system__address_distance(system1, system2) AS
        (WITH 
            __p1 AS (SELECT StarPos FROM systems WHERE SystemAddress = system1 LIMIT 1),
            __p2 AS (SELECT StarPos FROM systems WHERE SystemAddress = system2 LIMIT 1)
        SELECT array_distance(__p1.StarPos, __p2.StarPos)
        FROM __p1, __p2);
    """)
    conn.execute("""
        CREATE OR REPLACE TABLE infra_failures AS
        WITH infra_failures AS (
            -- 1. Find all (SystemAddress, FactionName) pairs with InfrastructureFailure
            SELECT DISTINCT SystemAddress, Name as FactionName, timestamp
            FROM (SELECT SystemAddress, timestamp, UNNEST(Factions, recursive:=true) FROM db.system_latest) AS f
            WHERE list_has_any(f.ActiveStates, ['InfrastructureFailure'])
        ),

        stations AS (
            -- 2. Find stations with a market
            SELECT SystemAddress, MarketID, StationName, StarSystem, StationFaction.Name AS FactionName, timestamp
            FROM db.station_latest
            WHERE MarketId IS NOT NULL
        ),

        infra_stations AS (
            -- 2b. Only stations in systems and controlled by the faction with InfrastructureFailure
            SELECT s.*, i.timestamp as InfraFailTimestamp
            FROM stations s
            JOIN infra_failures i USING(SystemAddress, FactionName)
        ),

        stations_with_commodities AS (
            -- 3. Join to commodities and filter for gold or palladium in stock
            SELECT
                s.StarSystem,
                s.SystemAddress,
                s.StationName,
                s.MarketID,
                s.FactionName,
                c.Name as Commodity,
                c.BuyPrice,
                c.Stock,
                s.InfraFailTimestamp,
                c.timestamp AS MarketTimestamp,
            FROM infra_stations s
            JOIN (select MarketId, UNNEST(commodities, recursive:=true), timestamp FROM db.commodities_latest) c
            ON s.MarketId = c.marketId
            WHERE c.Name IN ('gold', 'silver', 'palladium')
            AND c.Stock > 0
        ),

        wash_locations as (
            SELECT StarSystem, SystemAddress, StationName, MarketId, FactionName, array_agg([Commodity,BuyPrice::VARCHAR,Stock::VARCHAR]) as Commodities ,max(InfraFailTimestamp) AS InfraFailTimestamp, max(MarketTimestamp) AS MarketTimestamp
            FROM stations_with_commodities
            GROUP BY ALL
        )

        SELECT
            wl.StarSystem,
            wl.SystemAddress,
            wl.StationName,
            wl.MarketId,
            wl.FactionName,
            wl.Commodities,
            wl.InfraFailTimestamp,
            wl.MarketTimestamp,
            s.ControllingPower,
            s.PowerplayState
        FROM wash_locations wl
        JOIN systems s ON s.SystemAddress = wl.SystemAddress
        ORDER BY InfraFailTimestamp DESC, MarketTimestamp DESC;
    """)
    conn.close()
    print("Done.")

if __name__ == "__main__":
    make_report_db()