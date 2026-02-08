"""
Extract and flatten faction data from jumps_location into a dedicated factions.duckdb database.
Uses CTE with UNNEST for optimal performance.
"""

import os
import time
import bz2
import duckdb
from constants import DB_MAIN_PATH

DB_FACTIONS_PATH = os.path.join(os.path.dirname(DB_MAIN_PATH), "factions.duckdb")
DB_FACTIONS_CSV_PATH = os.path.join(os.path.dirname(DB_MAIN_PATH), "factions.csv")
DB_FACTIONS_CSV_BZ2_PATH = os.path.join(os.path.dirname(DB_MAIN_PATH), "factions.csv.bz2")


def extract_factions():
    """Extract and unnest faction data directly to factions database."""
    
    conn = duckdb.connect(DB_MAIN_PATH, read_only=True)
    
    try:
        print(f"Starting faction extraction from {DB_MAIN_PATH}...")
        start_time = time.time()
        
        # Attach factions database
        conn.execute(f"ATTACH DATABASE '{DB_FACTIONS_PATH}' AS factions_db (READ_WRITE)")
        conn.execute("DROP TABLE IF EXISTS factions_db.factions")
        
        print("Extracting and unnesting faction data...")
        
        # CTE with UNNEST for fast processing
        conn.execute("""
        CREATE TABLE factions_db.factions AS
        WITH unnested AS (
            SELECT
                timestamp,
                StarSystem,
                SystemAddress,
                SystemFaction,
                SystemAllegiance,
                SystemEconomy,
                SystemGovernment,
                SystemSecondEconomy,
                SystemSecurity,
                UNNEST(Factions) as t
            FROM jumps_location
            WHERE timestamp >= '2026-01-01'
        )
        SELECT 
            timestamp,
            StarSystem,
            SystemAddress,
            SystemFaction.Name as SystemFactionName,
            SystemFaction.FactionState as SystemFactionState,
            SystemAllegiance,
            SystemEconomy,
            SystemGovernment,
            SystemSecondEconomy,
            SystemSecurity,
            t.Name AS FactionName,
            t.Allegiance AS FactionAllegiance,
            t.FactionState,
            t.Government AS FactionGovernment,
            t.Influence,
            t.Happiness,
            t.ActiveStates,
            t.RecoveringStates,
            t.PendingStates
        FROM unnested
        """)
        
        elapsed_time = time.time() - start_time
        print(f"\n✓ Successfully extracted faction data")
        print(f"  Database: {DB_FACTIONS_PATH}")
        print(f"  Total time: {elapsed_time:.1f}s")
        
        # Export sample to CSV
        print("Exporting to CSV...")
        conn.execute(f"""
        COPY (
            SELECT * FROM factions_db.factions
        ) TO '{DB_FACTIONS_CSV_PATH}' (HEADER, DELIMITER ',')
        """)
        print(f"  ✓ CSV exported: {DB_FACTIONS_CSV_PATH}")
        
        # Compress CSV with bz2
        print("Compressing CSV with bz2...")
        compress_start = time.time()
        with open(DB_FACTIONS_CSV_PATH, 'rb') as f_in:
            with bz2.open(DB_FACTIONS_CSV_BZ2_PATH, 'wb', compresslevel=9) as f_out:
                f_out.write(f_in.read())
        
        # Remove uncompressed file
        os.remove(DB_FACTIONS_CSV_PATH)
        compress_time = time.time() - compress_start
        
        # Get file size
        file_size_mb = os.path.getsize(DB_FACTIONS_CSV_BZ2_PATH) / (1024 * 1024)
        
        print(f"  ✓ Compressed: {DB_FACTIONS_CSV_BZ2_PATH}")
        print(f"  ✓ Size: {file_size_mb:.2f} MB")
        print(f"  ✓ Compression time: {compress_time:.1f}s")
        
    finally:
        conn.close()


if __name__ == "__main__":
    extract_factions()
