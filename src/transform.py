"""
Transform: Materialize station_latest table for performance.

Converts the deprecated station_latest view logic into a physical materialized table.
Combines data from docked, approach_settlement, and location tables,
taking the most recent state for each unique station.
"""

from db import connect_db


def materialize_station_latest():
    """
    Create materialized station_latest table from source data.
    Uses DuckDB's MERGE INTO for efficient upserts.
    Key: (SystemAddress, StationName).
    """
    conn = connect_db()
    
    print("Materializing station_latest...")
    
    try:
        # Ensure table exists and primary key is set
        conn.execute("""
        CREATE TABLE IF NOT EXISTS station_latest AS
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
            StationServices,
            LandingPads
        FROM docked
        WHERE 1 = 0
        """)
        try:
            conn.execute("""
            ALTER TABLE station_latest
            ADD PRIMARY KEY (SystemAddress, StationName)
            """)
        except Exception:
            pass

        cutoff = conn.execute("""
        SELECT COALESCE(
            MAX(timestamp) - INTERVAL '1 hour',
            TIMESTAMP '1970-01-01'
        )
        FROM station_latest
        """).fetchone()[0]

        # Stage 1: MERGE docked
        print("  Merging docked...", end=" ")
        conn.execute("""
        MERGE INTO station_latest t
        USING (
            SELECT
                arg_max(timestamp, timestamp) AS timestamp,
                arg_max(StarSystem, timestamp) AS StarSystem,
                SystemAddress,
                StationName,
                arg_max(StationType, timestamp) AS StationType,
                arg_max(MarketId, timestamp) AS MarketId,
                arg_max(DistFromStarLS, timestamp) AS DistFromStarLS,
                arg_max(StarPos, timestamp) AS StarPos,
                arg_max(StationAllegiance, timestamp) AS StationAllegiance,
                arg_max(StationEconomies, timestamp) AS StationEconomies,
                arg_max(StationEconomy, timestamp) AS StationEconomy,
                arg_max(StationFaction, timestamp) AS StationFaction,
                arg_max(StationGovernment, timestamp) AS StationGovernment,
                arg_max(StationServices, timestamp) AS StationServices,
                arg_max(LandingPads, timestamp) AS LandingPads
            FROM docked
            WHERE timestamp > ?
            GROUP BY SystemAddress, StationName
        ) s
        ON t.SystemAddress = s.SystemAddress
           AND t.StationName = s.StationName
        WHEN MATCHED AND s.timestamp > t.timestamp THEN
            UPDATE SET
                timestamp = s.timestamp,
                StarSystem = s.StarSystem,
                StationType = s.StationType,
                MarketId = s.MarketId,
                DistFromStarLS = s.DistFromStarLS,
                StarPos = s.StarPos,
                StationAllegiance = s.StationAllegiance,
                StationEconomies = s.StationEconomies,
                StationEconomy = s.StationEconomy,
                StationFaction = s.StationFaction,
                StationGovernment = s.StationGovernment,
                StationServices = s.StationServices,
                LandingPads = s.LandingPads
        WHEN MATCHED AND t.LandingPads IS NULL AND s.LandingPads IS NOT NULL THEN
            UPDATE SET
                LandingPads = s.LandingPads
        WHEN NOT MATCHED THEN
            INSERT VALUES (
                s.timestamp, s.StarSystem, s.SystemAddress, s.StationName, s.StationType,
                s.MarketId, s.DistFromStarLS, s.StarPos, s.StationAllegiance,
                s.StationEconomies, s.StationEconomy, s.StationFaction,
                s.StationGovernment, s.StationServices, s.LandingPads
            )
        """, [cutoff])
        count = conn.execute("SELECT COUNT(*) FROM station_latest").fetchone()[0]
        print(f"✓ ({count:,})")
        
        # Stage 2: MERGE approach_settlement
        print("  Merging approach_settlement...", end=" ")
        conn.execute("""
        MERGE INTO station_latest t
        USING (
            SELECT
                arg_max(timestamp, timestamp) AS timestamp,
                arg_max(StarSystem, timestamp) AS StarSystem,
                SystemAddress,
                Name AS StationName,
                'Empty' AS StationType,
                arg_max(MarketId, timestamp) AS MarketId,
                NULL AS DistFromStarLS,
                arg_max(StarPos, timestamp) AS StarPos,
                arg_max(StationAllegiance, timestamp) AS StationAllegiance,
                arg_max(StationEconomies, timestamp) AS StationEconomies,
                arg_max(StationEconomy, timestamp) AS StationEconomy,
                arg_max(StationFaction, timestamp) AS StationFaction,
                arg_max(StationGovernment, timestamp) AS StationGovernment,
                arg_max(StationServices, timestamp) AS StationServices,
                NULL AS LandingPads
            FROM approach_settlement
            WHERE timestamp > ?
            GROUP BY SystemAddress, Name
        ) s
        ON t.SystemAddress = s.SystemAddress 
           AND t.StationName = s.StationName
        WHEN MATCHED AND s.timestamp > t.timestamp THEN
            UPDATE SET 
                timestamp = s.timestamp,
                StarSystem = s.StarSystem,
                StationType = s.StationType,
                MarketId = s.MarketId,
                DistFromStarLS = s.DistFromStarLS,
                StarPos = s.StarPos,
                StationAllegiance = s.StationAllegiance,
                StationEconomies = s.StationEconomies,
                StationEconomy = s.StationEconomy,
                StationFaction = s.StationFaction,
                StationGovernment = s.StationGovernment,
                StationServices = s.StationServices,
                LandingPads = COALESCE(t.LandingPads, s.LandingPads)
        WHEN NOT MATCHED THEN
            INSERT VALUES (
                s.timestamp, s.StarSystem, s.SystemAddress, s.StationName, s.StationType,
                s.MarketId, s.DistFromStarLS, s.StarPos, s.StationAllegiance,
                s.StationEconomies, s.StationEconomy, s.StationFaction,
                s.StationGovernment, s.StationServices, s.LandingPads
            )
        """, [cutoff])
        count = conn.execute("SELECT COUNT(*) FROM station_latest").fetchone()[0]
        print(f"✓ ({count:,} total)")
        
        # Stage 3: MERGE location (docked only)
        print("  Merging location...", end=" ")
        conn.execute("""
        MERGE INTO station_latest t
        USING (
            SELECT
                arg_max(timestamp, timestamp) AS timestamp,
                arg_max(StarSystem, timestamp) AS StarSystem,
                SystemAddress,
                StationName,
                arg_max(StationType, timestamp) AS StationType,
                arg_max(MarketId, timestamp) AS MarketId,
                arg_max(DistFromStarLS, timestamp) AS DistFromStarLS,
                arg_max(StarPos, timestamp) AS StarPos,
                NULL AS StationAllegiance,
                arg_max(StationEconomies, timestamp) AS StationEconomies,
                arg_max(StationEconomy, timestamp) AS StationEconomy,
                arg_max(StationFaction, timestamp) AS StationFaction,
                arg_max(StationGovernment, timestamp) AS StationGovernment,
                arg_max(StationServices, timestamp) AS StationServices,
                NULL AS LandingPads
            FROM location
            WHERE Docked = TRUE AND StationName IS NOT NULL AND timestamp > ?
            GROUP BY SystemAddress, StationName
        ) s
        ON t.SystemAddress = s.SystemAddress 
           AND t.StationName = s.StationName
        WHEN MATCHED AND s.timestamp > t.timestamp THEN
            UPDATE SET 
                timestamp = s.timestamp,
                StarSystem = s.StarSystem,
                StationType = s.StationType,
                MarketId = s.MarketId,
                DistFromStarLS = s.DistFromStarLS,
                StarPos = s.StarPos,
                StationAllegiance = s.StationAllegiance,
                StationEconomies = s.StationEconomies,
                StationEconomy = s.StationEconomy,
                StationFaction = s.StationFaction,
                StationGovernment = s.StationGovernment,
                StationServices = s.StationServices,
                LandingPads = COALESCE(t.LandingPads, s.LandingPads)
        WHEN NOT MATCHED THEN
            INSERT VALUES (
                s.timestamp, s.StarSystem, s.SystemAddress, s.StationName, s.StationType,
                s.MarketId, s.DistFromStarLS, s.StarPos, s.StationAllegiance,
                s.StationEconomies, s.StationEconomy, s.StationFaction,
                s.StationGovernment, s.StationServices, s.LandingPads
            )
        """, [cutoff])
        count = conn.execute("SELECT COUNT(*) FROM station_latest").fetchone()[0]
        print(f"✓ ({count:,} total)")
        
        conn.close()
        
    except Exception as e:
        print(f"✗ Error materializing station_latest: {e}")
        conn.close()
        raise


def main():
    materialize_station_latest()


if __name__ == "__main__":
    main()
