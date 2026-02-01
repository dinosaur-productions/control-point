"""
Migration script to convert all DuckDB enum columns to VARCHAR.

This script:
1. For each table with enum columns, creates new VARCHAR columns
2. Copies existing data (enum values automatically convert to strings)
3. Drops old enum columns and renames new ones
4. Drops orphaned enum types

Run this once before switching to the new VARCHAR-based schema in db.py.
"""

import os
import sys
import shutil
from db import (
    connect_db, create_schema, DB_MAIN_PATH, POWER, POWERPLAYSTATE, ALLEGIANCE, ECONOMY,
    GOVERNMENT, SECURITY, BODY_TYPE, STATION_TYPE, CARRIER_DOCKING_ACCESS,
    SERVICES, SIGNAL_TYPE, FACTION_STATE, HAPPINESS, COMMODITY_BRACKET,
    RESERVE_LEVEL, BELT_OR_RING_TYPE, FSS_SIGNAL_TYPE, CONFLICT_STATUS,
    CONFLICT_WAR_TYPE
)

# Mapping of enum names to their Python constant lists
ENUM_MAPPINGS = {
    'power_enum': POWER,
    'powerplaystate_enum': POWERPLAYSTATE,
    'allegiance_enum': ALLEGIANCE,
    'economy_enum': ECONOMY,
    'government_enum': GOVERNMENT,
    'security_enum': SECURITY,
    'body_type_enum': BODY_TYPE,
    'station_type_enum': STATION_TYPE,
    'carrier_docking_access_enum': CARRIER_DOCKING_ACCESS,
    'service_enum': SERVICES,
    'signal_type_enum': SIGNAL_TYPE,
    'faction_state_enum': FACTION_STATE,
    'happiness_enum': HAPPINESS,
    'commodity_bracket_enum': COMMODITY_BRACKET,
    'reserve_level_enum': RESERVE_LEVEL,
    'belt_or_ring_type_enum': BELT_OR_RING_TYPE,
    'fss_signal_type_enum': FSS_SIGNAL_TYPE,
    'conflict_status_enum': CONFLICT_STATUS,
    'conflict_war_type_enum': CONFLICT_WAR_TYPE,
}

def get_table_columns_with_enums(conn):
    """Get all table columns that use enum types (named or anonymous)."""
    result = conn.execute("""
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'main'
        AND (
            data_type IN ('power_enum', 'powerplaystate_enum', 'allegiance_enum', 'economy_enum',
                          'government_enum', 'security_enum', 'body_type_enum', 'station_type_enum',
                          'carrier_docking_access_enum', 'service_enum', 'signal_type_enum',
                          'faction_state_enum', 'happiness_enum', 'commodity_bracket_enum',
                          'reserve_level_enum', 'belt_or_ring_type_enum', 'fss_signal_type_enum',
                          'conflict_status_enum', 'conflict_war_type_enum')
            OR data_type LIKE '%power_enum%'
            OR data_type LIKE '%powerplaystate_enum%'
            OR data_type LIKE '%allegiance_enum%'
            OR data_type LIKE '%economy_enum%'
            OR data_type LIKE '%government_enum%'
            OR data_type LIKE '%security_enum%'
            OR data_type LIKE '%body_type_enum%'
            OR data_type LIKE '%station_type_enum%'
            OR data_type LIKE '%carrier_docking_access_enum%'
            OR data_type LIKE '%service_enum%'
            OR data_type LIKE '%signal_type_enum%'
            OR data_type LIKE '%faction_state_enum%'
            OR data_type LIKE '%happiness_enum%'
            OR data_type LIKE '%commodity_bracket_enum%'
            OR data_type LIKE '%reserve_level_enum%'
            OR data_type LIKE '%belt_or_ring_type_enum%'
            OR data_type LIKE '%fss_signal_type_enum%'
            OR data_type LIKE '%conflict_status_enum%'
            OR data_type LIKE '%conflict_war_type_enum%'
            OR data_type LIKE 'ENUM(%'
        )
        ORDER BY table_name, ordinal_position
    """).fetchall()
    
    return result

def migrate_table_column(conn, table_name, column_name, old_type, new_type='VARCHAR'):
    """Migrate a single column from enum to VARCHAR."""
    print(f"  Migrating {table_name}.{column_name} ({old_type} -> {new_type})...")
    
    temp_col = f"{column_name}_temp"
    
    # Add new VARCHAR column
    conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {temp_col} {new_type};")
    
    # Copy data (enum automatically converts to string)
    conn.execute(f"UPDATE {table_name} SET {temp_col} = CAST({column_name} AS {new_type});")
    
    # Drop old enum column
    conn.execute(f"ALTER TABLE {table_name} DROP COLUMN {column_name};")
    
    # Rename new column to original name
    conn.execute(f"ALTER TABLE {table_name} RENAME COLUMN {temp_col} TO {column_name};")

def migrate_struct_field(conn, table_name, struct_column, field_name, old_enum_type):
    """
    Migrate a field within a struct column from enum to VARCHAR.
    This is more complex and requires restructuring the struct.
    """
    print(f"  Migrating {table_name}.{struct_column} (field: {field_name}, {old_enum_type} -> VARCHAR)...")
    
    # This requires reading all data, transforming it, and rewriting
    # For now, this is handled by recreating the struct with the new field types
    # The actual migration happens when we recreate the table schema
    pass

def drop_unused_enum_types(conn):
    """Drop all enum types that are no longer used."""
    enum_types = list(ENUM_MAPPINGS.keys())
    
    for enum_type in enum_types:
        try:
            conn.execute(f"DROP TYPE IF EXISTS {enum_type};")
            print(f"  Dropped enum type: {enum_type}")
        except Exception as e:
            print(f"  Failed to drop {enum_type}: {e}")

def migrate_database(db_path=DB_MAIN_PATH):
    """Execute the full migration."""
    print(f"\n=== Starting enum to VARCHAR migration ===")
    print(f"Database: {db_path}\n")

    conn = connect_db(db_path)

    try:
        # Get all enum columns (named or anonymous)
        enum_columns = get_table_columns_with_enums(conn)

        if not enum_columns:
            print("No enum columns found. Migration may already be complete.")
            # Drop unused enum types if any linger
            print(f"\nDropping unused enum types...")
            drop_unused_enum_types(conn)
            conn.commit()
            print(f"\n=== Migration complete ===\n")
            return

        print(f"Found {len(enum_columns)} enum column(s) to migrate:\n")

    finally:
        conn.close()

    # Use rebuild approach to handle nested enums inside structs
    migrated_path = f"{db_path}.migrated"
    backup_path = f"{db_path}.backup"

    if os.path.exists(migrated_path):
        os.remove(migrated_path)

    new_conn = connect_db(migrated_path)
    new_conn_closed = False
    try:
        new_conn.execute("SET python_enable_replacements=false;")
        create_schema(new_conn)

        # Attach old database for copying
        new_conn.execute(f"ATTACH '{db_path}' AS old;")

        # Copy all base tables that exist in the new schema
        table_rows = new_conn.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'main' AND table_type = 'BASE TABLE'
              AND table_catalog = current_database()
            ORDER BY table_name
        """).fetchall()

        copy_failures = []
        for (table_name,) in table_rows:
            print(f"Copying table: {table_name}")
            try:
                new_conn.execute(f"INSERT INTO {table_name} SELECT * FROM old.{table_name};")
            except Exception as e:
                copy_failures.append((table_name, str(e)))
                print(f"  Skipping {table_name}: {e}")

        new_conn.execute("DETACH old;")
        new_conn.commit()

        if copy_failures:
            raise RuntimeError(f"Copy failed for {len(copy_failures)} tables: {copy_failures}")
    except Exception:
        new_conn.close()
        new_conn_closed = True
        if os.path.exists(migrated_path):
            os.remove(migrated_path)
        raise
    finally:
        if not new_conn_closed:
            new_conn.close()

    # Swap databases: keep a backup of the old db
    if os.path.exists(backup_path):
        os.remove(backup_path)
    shutil.move(db_path, backup_path)
    shutil.move(migrated_path, db_path)

    # Re-open to drop any lingering enum types
    conn = connect_db(db_path)
    try:
        print(f"\nDropping unused enum types...")
        drop_unused_enum_types(conn)
        conn.commit()
    finally:
        conn.close()

    print(f"\n=== Migration complete ===\n")

if __name__ == "__main__":
    try:
        migrate_database()
        print("Migration succeeded!")
    except Exception as e:
        print(f"\nMigration FAILED: {e}", file=sys.stderr)
        sys.exit(1)
