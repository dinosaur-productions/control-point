import os
import re
from db import (
    connect_db, create_schema, POWER, POWERPLAYSTATE, ALLEGIANCE, ECONOMY, 
    GOVERNMENT, SECURITY, BODY_TYPE, STATION_TYPE, CARRIER_DOCKING_ACCESS, 
    SIGNAL_TYPE, FACTION_STATE, HAPPINESS, COMMODITY_BRACKET,
    RESERVE_LEVEL, BELT_OR_RING_TYPE, FSS_SIGNAL_TYPE, CONFLICT_STATUS,
    CONFLICT_WAR_TYPE
)
from constants import DIR_DATA_DUMP
import gzip

def get_imported_files(conn):
    result = conn.execute("SELECT filename, last_line, filesize FROM imported_files").fetchall()
    return {row[0]: {"last_line": row[1], "filesize": row[2]} for row in result}

def update_imported_file(conn, filename: str, last_line, filesize):
    conn.execute("""
        INSERT INTO imported_files (filename, last_line, filesize)
        VALUES (?, ?, ?)
        ON CONFLICT(filename) DO UPDATE SET last_line=excluded.last_line, filesize=excluded.filesize
    """, [filename.removesuffix(".gz"), last_line, filesize])

IMPORT_CUTOFF = "2025-09-01"

def should_import_file(fname, imported, required_substring=None):
    if not (fname.endswith(".jsonl") or fname.endswith(".gz")):
        return False, None, None, None
    if required_substring and required_substring not in fname:
        return False, None, None, None
    match = re.search(r'(\d{4}-\d{2}-\d{2})', fname)
    if match and match.group(1) < IMPORT_CUTOFF:
        print(f"Skipping {fname}: before {IMPORT_CUTOFF}")
        return False, None, None, None
    fpath = os.path.join(DIR_DATA_DUMP, fname)
    filesize = os.path.getsize(fpath)
    imported_entry = imported.get(fname.removesuffix(".gz"), {})
    last_line = imported_entry.get("last_line", 0)
    old_filesize = imported_entry.get("filesize", None)
    if old_filesize == filesize:
        print(f"Skipping {fname}: file size unchanged.")
        return False, None, None, None
    return True, fpath, filesize, last_line

def create_temp_table(fpath):
    """
    Creates a temp table from EDDN JSONL data with game version filtering.
    
    Elite Dangerous galaxy split on May 19, 2021 with Odyssey release:
    - Version 3.x: Legacy/Horizons client (different galaxy state)
    - Version 4.x+: Odyssey client (current galaxy state)
    
    Filter Strategy:
    - Accept: CAPI sources (server-side, version-agnostic) OR Odyssey 4.x+ client data
    - Reject: All Legacy/Horizons 3.x versions to maintain galaxy consistency
    """
    return  f"""
            SELECT *, row_number() OVER () AS rn
            FROM read_ndjson_auto('{fpath}', union_by_name=true, ignore_errors=true)
            WHERE 
                (
                    -- CAPI (Companion API) sources: server-side data, version-agnostic, always accept
                    header->>'gameversion' IN (
                        'CAPI-journal', 'CAPI-Live-market', 'CAPI-market', 
                    ) 
                    -- Odyssey-era clients: major version >= 4 ensures post-split galaxy consistency
                    -- Legacy versions (named patches like "Fleet Carriers Update") fail the integer cast
                    OR (TRY_CAST(SPLIT_PART(header->>'gameversion', '.', 1) AS INTEGER) IS NOT NULL
                        AND TRY_CAST(SPLIT_PART(header->>'gameversion', '.', 1) AS INTEGER) >= 4)
                )
                AND TRY_CAST(header->>'gatewayTimestamp' AS TIMESTAMP) IS NOT NULL
                AND TRY_CAST(message->>'timestamp' AS TIMESTAMP) IS NOT NULL
                AND TRY_CAST(message->>'timestamp' AS TIMESTAMP) >= TRY_CAST(header->>'gatewayTimestamp' AS TIMESTAMP) - INTERVAL '1 hour'
            """

def to_economy_enum(expr):
    # Strip $economy_ prefix and ; suffix, but if the result is empty or doesn't match pattern, return 'Unknown'
    return f"""CASE 
        WHEN {expr} LIKE '$economy_UNKNOWN%' THEN 'Unknown'
        WHEN {expr} LIKE '$economy_%' THEN REGEXP_REPLACE(REGEXP_REPLACE({expr}, '^\\$economy_', ''), ';$', '')
        ELSE 'Unknown'
    END
    """

def to_economy_enum_proportion(expr):
    get_name = "e->>'name'"
    return f"list_transform(CAST({expr} AS JSON[]), e -> struct_pack(Name := {generate_enum_check(to_economy_enum(get_name), ECONOMY, "Economies.Name")}, Proportion:= e->>'proportion'))"

def to_government_enum(expr):
    return f"REGEXP_REPLACE(REGEXP_REPLACE({expr}, '^\\$government_', ''), ';$', '')"

def to_allegiance_enum(expr):
    return f"CASE WHEN {expr} = '' THEN 'None' ELSE REGEXP_REPLACE(REGEXP_REPLACE({expr}, '^\\$faction_', ''), ';$', '') END"

def to_security_enum(expr):
    return f"""
        CASE
            WHEN {expr} LIKE '%$SYSTEM_SECURITY_high%' THEN 'High'
            WHEN {expr} LIKE '%$SYSTEM_SECURITY_low%' THEN 'Low'
            WHEN {expr} LIKE '%$SYSTEM_SECURITY_medium%' THEN 'Medium'
            WHEN {expr} LIKE '%$GAlAXY_MAP_INFO_state_anarchy%' THEN 'Anarchy'
            WHEN {expr} LIKE '%$GALAXY_MAP_INFO_state_lawless%' THEN 'Lawless'
            ELSE 'Unknown'
        END
    """

def to_faction_state(expr):
    return f"{{'Name': {expr}->>'Name', 'FactionState': COALESCE({expr}->>'FactionState', 'None')}}"

def to_station_type_enum(expr):
    return f"CASE WHEN {expr} = '' THEN 'Empty' WHEN {expr} = 'Megaship' THEN 'MegaShip' ELSE {expr} END"

def to_count_signal_type_enum(expr):
    return f"""
        list_transform(CAST({expr} AS JSON[]), s -> struct_pack(
            Count := CAST(s->>'Count' AS INTEGER),
            Type := {generate_enum_check("CASE WHEN s ->>'Type' = 'tritium' THEN 'Tritium' ELSE REGEXP_REPLACE(REGEXP_REPLACE(s->>'Type', '^\\$SAA_SignalType_', ''), ';$', '') END", SIGNAL_TYPE, "Signals.Type")}
        ))
    """

def to_conflict(expr):
    """Convert Conflicts JSON array to struct with validated Status and WarType fields."""
    return f"""
        list_transform(CAST({expr} AS JSON[]), c -> struct_pack(
            Faction1 := struct_pack(
                Name := c->'Faction1'->>'Name',
                Stake := c->'Faction1'->>'Stake',
                WonDays := CAST(c->'Faction1'->>'WonDays' AS INTEGER)
            ),
            Faction2 := struct_pack(
                Name := c->'Faction2'->>'Name',
                Stake := c->'Faction2'->>'Stake',
                WonDays := CAST(c->'Faction2'->>'WonDays' AS INTEGER)
            ),
            Status := {generate_enum_check("c->>'Status'", CONFLICT_STATUS, "Conflict.Status")},
            WarType := {generate_enum_check("c->>'WarType'", CONFLICT_WAR_TYPE, "Conflict.WarType")}
        ))
    """

def to_commodities(expr):
        return f"""
        list_transform(
            CAST({expr} AS JSON[]),
            c -> struct_pack(
                Name := c->>'name',
                BuyPrice := c->>'buyPrice',
                SellPrice := c->>'sellPrice',
                MeanPrice := c->>'meanPrice',
                Stock := c->>'stock',
                StockBracket := {generate_enum_check("CASE WHEN c->>'stockBracket' in ('0', '') THEN 'None' WHEN c->>'stockBracket' = '1' THEN 'Low' WHEN c->>'stockBracket' = '2' THEN 'Med' WHEN c->>'stockBracket' = '3' THEN 'High' END", COMMODITY_BRACKET, "Commodities.StockBracket")},
                Demand := c->>'demand',
                DemandBracket := {generate_enum_check("CASE WHEN c->>'demandBracket' in ('0', '') THEN 'None' WHEN c->>'demandBracket' = '1' THEN 'Low' WHEN c->>'demandBracket' = '2' THEN 'Med' WHEN c->>'demandBracket' = '3' THEN 'High' END", COMMODITY_BRACKET, "Commodities.DemandBracket")},
                StatusFlags := [replace(replace(flag, 'rare', 'Rare'), 'High demand', 'High Demand') for flag in CAST(c->'statusFlags' AS VARCHAR[])]
            )
        )
    """

def to_faction_detail(expr):
    # expr should be a JSON array of faction objects
    return f"""
        list_transform(CAST({expr} AS JSON[]), f -> struct_pack(
            Name := f->>'Name',
            Allegiance := {generate_enum_check(to_allegiance_enum("f->>'Allegiance'"), ALLEGIANCE, "Factions.Allegiance")},
            FactionState := {generate_enum_check("f->>'FactionState'", FACTION_STATE, "Factions.FactionState")},
            Government := {generate_enum_check(to_government_enum("f->>'Government'"), GOVERNMENT, "Factions.Government")},
            Influence := f->>'Influence',
            Happiness := {generate_enum_check("CASE WHEN f->>'Happiness' = '$Faction_HappinessBand1;' THEN 'Elated' WHEN f->>'Happiness' = '$Faction_HappinessBand2;' THEN 'Happy' WHEN f->>'Happiness' = '$Faction_HappinessBand3;' THEN 'Discontented' WHEN f->>'Happiness' = '$Faction_HappinessBand4;' THEN 'Unhappy' WHEN f->>'Happiness' = '$Faction_HappinessBand5;' THEN 'Despondent' ELSE 'Unknown' END", HAPPINESS, "Factions.Happiness")},
            ActiveStates := list_transform(CAST(f->'ActiveStates' AS JSON[]), s -> (s->>'State')),
            RecoveringStates := f->'RecoveringStates',
            PendingStates := f->'PendingStates'
        ))
    """

def get_num_lines(fpath):
    if fpath.endswith(".gz"):
        with gzip.open(fpath, "rt", encoding="utf-8") as f:
            return sum(1 for _ in f)
    else:
        with open(fpath, "r", encoding="utf-8") as f:
            return sum(1 for _ in f)


def generate_enum_check(column_expr, allowed_values, column_name):
    """
    Generate a SQL expression that validates a value against allowed enum values.
    Returns the expression unchanged if valid, or calls error() with a message if invalid.
    
    Args:
        column_expr: SQL expression to validate (e.g., "message->>'Economy'")
        allowed_values: List of allowed string values (e.g., ECONOMY constant)
        column_name: Human-readable column name for error messages
    
    Returns:
        SQL CASE/WHEN expression that validates and returns the value, or errors
    
    Example:
        generate_enum_check("message->>'SystemEconomy'", ECONOMY, "SystemEconomy")
        -> "CASE WHEN message->>'SystemEconomy' IN (...) THEN message->>'SystemEconomy' ELSE error('Invalid SystemEconomy: ' || message->>'SystemEconomy') END"
    """
    allowed_str = ', '.join(repr(v) for v in allowed_values)
    return f"""
        CASE 
            WHEN {column_expr} IS NULL THEN NULL
            WHEN {column_expr} IN ({allowed_str}) THEN {column_expr}
            ELSE error('Invalid {column_name}: ' || {column_expr})
        END
    """


def validate_enum_list(column_expr, allowed_values, column_name):
    """
    Generate a SQL expression that validates each element in a string array against allowed enum values.
    
    Args:
        column_expr: SQL expression returning a VARCHAR array (e.g., "CAST(message->'Powers' AS VARCHAR[])")
        allowed_values: List of allowed string values
        column_name: Human-readable column name for error messages
    
    Returns:
        SQL expression that validates all array elements
    """
    allowed_str = ', '.join(repr(v) for v in allowed_values)
    return f"""
        list_transform(
            {column_expr},
            x -> CASE
                WHEN x IS NULL THEN NULL
                WHEN x IN ({allowed_str}) THEN x
                ELSE error('Invalid {column_name} array element: ' || x)
            END
        )
    """


# handles both fsdjump and carrierjump
def import_jump_jsonl_files(conn, imported):
    for fname in sorted(os.listdir(DIR_DATA_DUMP)):
        should_import, fpath, filesize, last_line = should_import_file(fname, imported, required_substring="Jump")
        if not should_import:
            continue
        
        print(f"Importing jump file {fname} from line {last_line+1}...")

        conn.execute(f"""
            WITH 
            tmp_jump_raw AS ({create_temp_table(fpath)}),
            extracted AS (
            SELECT
                message->>'timestamp' AS timestamp,
                message->>'StarSystem' AS StarSystem,
                CAST(message->>'SystemAddress' AS BIGINT) AS SystemAddress,
                message->>'Body' AS Body,
                CAST(message->>'BodyId' AS INTEGER) AS BodyId,
                message->>'BodyType' AS BodyType,
                CAST(message->>'Population' AS BIGINT) AS Population,
                CASE 
                    WHEN message->>'PowerplayState' = '' THEN NULL
                    ELSE {generate_enum_check("message->>'PowerplayState'", POWERPLAYSTATE, "PowerplayState")}
                END AS PowerplayState,
                {generate_enum_check("message->>'ControllingPower'", POWER, "ControllingPower")} AS ControllingPower,
                {validate_enum_list("CAST(message->>'Powers' AS VARCHAR[])", POWER, "Powers")} AS Powers,
                message->>'PowerplayConflictProgress' AS PowerplayConflictProgress,
                CAST(message->>'PowerplayStateControlProgress' AS DOUBLE) AS PowerplayStateControlProgress,
                CAST(message->>'PowerplayStateReinforcement' AS INTEGER) AS PowerplayStateReinforcement,
                CAST(message->>'PowerplayStateUndermining' AS INTEGER) AS PowerplayStateUndermining,
                {to_faction_detail("message->>'Factions'")} AS Factions,
                message->>'SystemFaction' AS SystemFaction,
                {generate_enum_check(to_allegiance_enum("message->>'SystemAllegiance'"), ALLEGIANCE, "SystemAllegiance")} AS SystemAllegiance,
                {generate_enum_check(to_economy_enum("message->>'SystemEconomy'"), ECONOMY, "SystemEconomy")} AS SystemEconomy,
                {generate_enum_check(to_government_enum("message->>'SystemGovernment'"), GOVERNMENT, "SystemGovernment")} AS SystemGovernment,
                {generate_enum_check(to_economy_enum("message->>'SystemSecondEconomy'"), ECONOMY, "SystemSecondEconomy")} AS SystemSecondEconomy,
                {generate_enum_check(to_security_enum("message->>'SystemSecurity'"), SECURITY, "SystemSecurity")} AS SystemSecurity,
                CAST(message->>'StarPos' AS DOUBLE[]) AS StarPos,
                {to_conflict("message->'Conflicts'")} as Conflicts,
                rn
            FROM tmp_jump_raw
            )
            INSERT INTO jumps (
                timestamp, StarSystem, SystemAddress, Body, BodyId, Population,
                PowerplayState, ControllingPower, Powers, PowerplayConflictProgress,
                PowerplayStateControlProgress, PowerplayStateReinforcement, PowerplayStateUndermining,
                Factions, SystemFaction,
                SystemAllegiance, SystemEconomy, SystemGovernment,
                SystemSecondEconomy, SystemSecurity, StarPos, Conflicts
            )
            SELECT
                timestamp, StarSystem, SystemAddress, Body, BodyId, Population,
                PowerplayState, ControllingPower, Powers, PowerplayConflictProgress,
                PowerplayStateControlProgress, PowerplayStateReinforcement, PowerplayStateUndermining,
                Factions, SystemFaction,
                SystemAllegiance, SystemEconomy, SystemGovernment,
                SystemSecondEconomy, SystemSecurity, StarPos, Conflicts
            FROM extracted
            WHERE rn > ? 
            AND (SystemSecurity IS NOT NULL AND SystemEconomy IS NOT NULL) -- bad data
        """, [last_line])

        num_lines = get_num_lines(fpath)
        update_imported_file(conn, fname, num_lines, filesize)



def import_commodity_jsonl_files(conn, imported):
    for fname in sorted(os.listdir(DIR_DATA_DUMP)):
        should_import, fpath, filesize, last_line = should_import_file(fname, imported, required_substring="Commodity")
        if not should_import:
            continue

        print(f"Importing commodity file {fname} from line {last_line+1}...")

        conn.execute(f"""
            WITH 
            tmp_commodity_raw AS ({create_temp_table(fpath)}),
            extracted AS (
                SELECT
                    message->>'systemName' AS SystemName,
                    message->>'stationName' AS StationName,
                    {generate_enum_check(to_station_type_enum("message->>'stationType'"), STATION_TYPE, "StationType")} AS StationType,
                    CAST(message->>'marketId' AS BIGINT) AS MarketId,
                    CAST(message->>'timestamp' AS TIMESTAMP) AS timestamp,
                    message->>'prohibited' AS Prohibited,
                    {to_economy_enum_proportion("message->'economies'")} AS Economies,
                    {generate_enum_check("message->>'carrierDockingAccess'", CARRIER_DOCKING_ACCESS, "CarrierDockingAccess")} AS CarrierDockingAccess,
                    {to_commodities("message->'commodities'")} AS Commodities,
                    rn
                FROM tmp_commodity_raw
            )

            INSERT OR REPLACE INTO commodities_latest (
                MarketId, SystemName, StationName, StationType, timestamp,
                Prohibited, Economies, CarrierDockingAccess, Commodities
            )
            SELECT DISTINCT ON (MarketId) 
                MarketId, SystemName, StationName, StationType, timestamp,
                Prohibited, Economies, CarrierDockingAccess, Commodities
            FROM extracted
            WHERE rn > ?
            ORDER BY timestamp DESC
        """, [last_line])

        num_lines = get_num_lines(fpath)
        update_imported_file(conn, fname, num_lines, filesize)

def import_approachsettlement_jsonl_files(conn, imported):
    for fname in sorted(os.listdir(DIR_DATA_DUMP)):
        should_import, fpath, filesize, last_line = should_import_file(fname, imported, required_substring="ApproachSettlement")
        if not should_import:
            continue
        print(f"Importing approach settlement file {fname} from line {last_line+1}...")

        conn.execute(f"""
            WITH 
            tmp_approachsettlement_raw AS ({create_temp_table(fpath)}),
            extracted AS (
                SELECT
                    message->>'timestamp' AS timestamp,
                    message->>'StarSystem' AS StarSystem,
                    CAST(message->>'SystemAddress' AS BIGINT) AS SystemAddress,
                    message->>'Body' AS Body,
                    CAST(message->>'BodyId' AS INTEGER) AS BodyId,
                    message->>'BodyName' AS BodyName,
                    CAST(message->>'Latitude' AS DOUBLE) AS Latitude,
                    CAST(message->>'Longitude' AS DOUBLE) AS Longitude,
                    CAST(message->>'MarketID' AS BIGINT) AS MarketId,
                    message->>'Name' AS Name,
                    CAST(message->>'StarPos' AS DOUBLE[]) AS StarPos,
                    {generate_enum_check("message->>'StationAllegiance'", ALLEGIANCE, "StationAllegiance")} AS StationAllegiance,
                    {to_economy_enum_proportion("message->'StationEconomies'")} AS StationEconomies,
                    {generate_enum_check(to_economy_enum("message->>'StationEconomy'"), ECONOMY, "StationEconomy")} AS StationEconomy,
                    {to_faction_state("message->'StationFaction'")} AS StationFaction,
                    {generate_enum_check(to_government_enum("message->>'StationGovernment'"), GOVERNMENT, "StationGovernment")} AS StationGovernment,
                    CAST(message->'StationServices' AS VARCHAR[]) AS StationServices,
                    rn
                FROM tmp_approachsettlement_raw
            )
            INSERT INTO approach_settlement (
                timestamp, StarSystem, SystemAddress, Body, BodyId, BodyName,
                Latitude, Longitude, MarketId, Name, StarPos,
                StationAllegiance, StationEconomies, StationEconomy,
                StationFaction, StationGovernment, StationServices
            )
            SELECT
                timestamp, StarSystem, SystemAddress, Body, BodyId, BodyName,
                Latitude, Longitude, MarketId, Name, StarPos,
                StationAllegiance, StationEconomies, StationEconomy,
                StationFaction, StationGovernment, StationServices
            FROM extracted
            WHERE rn > ?
        """, [last_line])

        num_lines = get_num_lines(fpath)
        update_imported_file(conn, fname, num_lines, filesize)

def import_docked_jsonl_files(conn, imported):
    for fname in sorted(os.listdir(DIR_DATA_DUMP)):
        should_import, fpath, filesize, last_line = should_import_file(fname, imported, required_substring="Docked")
        if not should_import:
            continue
        print(f"Importing docked file {fname} from line {last_line+1}...")

        conn.execute(f"""
            WITH 
            tmp_docked_raw AS ({create_temp_table(fpath)}),
            extracted AS (
                SELECT
                    CAST(message->>'timestamp' AS TIMESTAMP) AS timestamp,
                    message->>'StarSystem' AS StarSystem,
                    CAST(message->>'SystemAddress' AS BIGINT) AS SystemAddress,
                    message->>'StationName' AS StationName,
                    {generate_enum_check(to_station_type_enum("message->>'stationType'"), STATION_TYPE, "StationType")} AS StationType,
                    CAST(message->>'MarketID' AS BIGINT) AS MarketID,
                    CAST(message->>'DistFromStarLS' AS DOUBLE) AS DistFromStarLS,
                    CAST(message->>'StarPos' AS DOUBLE[]) AS StarPos,
                    {generate_enum_check("message->>'StationAllegiance'", ALLEGIANCE, "StationAllegiance")} AS StationAllegiance,
                    {to_economy_enum_proportion("message->'StationEconomies'")} AS StationEconomies,
                    {generate_enum_check(to_economy_enum("message->>'StationEconomy'"), ECONOMY, "StationEconomy")} AS StationEconomy,
                    {to_faction_state("message->'StationFaction'")} AS StationFaction,
                    {generate_enum_check(to_government_enum("message->>'StationGovernment'"), GOVERNMENT, "StationGovernment")} AS StationGovernment,
                    CAST(message->'StationServices' AS VARCHAR[]) AS StationServices,
                    CAST(message->'LandingPads' AS STRUCT(Large INTEGER, Medium INTEGER, Small INTEGER)) AS LandingPads,
                    rn
                FROM tmp_docked_raw
            )
            INSERT INTO docked (
                timestamp, StarSystem, SystemAddress, StationName, StationType, MarketID,
                DistFromStarLS, StarPos, StationEconomies, StationEconomy,
                StationFaction, StationGovernment, StationServices, LandingPads
            )
            SELECT
                timestamp, StarSystem, SystemAddress, StationName, StationType, MarketID,
                DistFromStarLS, StarPos, StationEconomies, StationEconomy, 
                StationFaction, StationGovernment, StationServices, LandingPads
            FROM extracted
            WHERE rn > ?
        """, [last_line])

        num_lines = get_num_lines(fpath)
        update_imported_file(conn, fname, num_lines, filesize)

# def import_fssbodysignals_jsonl_files(conn, imported):
#     for fname in sorted(os.listdir(DIR_DATA_DUMP)):
#         should_import, fpath, filesize, last_line = should_import_file(fname, imported, required_substring="FSSBodySignals")
#         if not should_import:
#             continue
#         print(f"Importing FSSBodySignals file {fname} from line {last_line+1}...")

#         conn.execute(f"""
#             WITH 
#             tmp_fssbodysignals_raw AS ({create_temp_table(fpath)}),
#             extracted AS (
#                 SELECT
#                     CAST(message->>'timestamp' AS TIMESTAMP) AS timestamp,
#                     message->>'StarSystem' AS StarSystem,
#                     CAST(message->>'SystemAddress' AS BIGINT) AS SystemAddress,
#                     CAST(message->>'BodyId' AS INTEGER) AS BodyId,
#                     message->>'BodyName' AS BodyName,
#                     {to_count_signal_type_enum("message->'Signals'")} AS Signals,
#                     CAST(message->>'StarPos' AS DOUBLE[]) AS StarPos,
#                     rn
#                 FROM tmp_fssbodysignals_raw
#             )
#             INSERT INTO fssbodysignals (
#                 timestamp, StarSystem, SystemAddress, BodyId, BodyName, Signals, StarPos
#             )
#             SELECT
#                 timestamp, StarSystem, SystemAddress, BodyId, BodyName, Signals, StarPos
#             FROM extracted
#             WHERE rn > ?
#         """, [last_line])

#         num_lines = get_num_lines(fpath)
#         update_imported_file(conn, fname, num_lines, filesize)


def import_location_jsonl_files(conn, imported):
    for fname in sorted(os.listdir(DIR_DATA_DUMP)):
        should_import, fpath, filesize, last_line = should_import_file(fname, imported, required_substring="Location")
        if not should_import:
            continue

        print(f"Importing Location file {fname} from line {last_line+1}...")

        conn.execute(f"""
            WITH 
            tmp_location_raw AS ({create_temp_table(fpath)}),
            extracted AS (
                SELECT
                    CAST(message->>'timestamp' AS TIMESTAMP) AS timestamp,
                    message->>'StarSystem' AS StarSystem,
                    CAST(message->>'SystemAddress' AS BIGINT) AS SystemAddress,
                    message->>'Body' AS Body,
                    CAST(message->>'BodyId' AS INTEGER) AS BodyId,
                    {generate_enum_check("message->>'BodyType'", BODY_TYPE, "BodyType")} AS BodyType,
                    CAST(message->>'DistFromStarLS' AS DOUBLE) AS DistFromStarLS,
                    CAST(message->>'Docked' AS BOOLEAN) AS Docked,
                    CAST(message->>'MarketID' AS BIGINT) AS MarketID,
                    CAST(message->>'Population' AS BIGINT) AS Population,
                    CASE WHEN message->>'PowerplayState' = '' THEN NULL ELSE {generate_enum_check("message->>'PowerplayState'", POWERPLAYSTATE, "PowerplayState")} END AS PowerplayState,
                    {generate_enum_check("message->>'ControllingPower'", POWER, "ControllingPower")} AS ControllingPower,
                    {validate_enum_list("CAST(message->>'Powers' AS VARCHAR[])", POWER, "Powers")} AS Powers,
                    message->>'PowerplayConflictProgress' AS PowerplayConflictProgress,
                    CAST(message->>'PowerplayStateControlProgress' AS DOUBLE) AS PowerplayStateControlProgress,
                    CAST(message->>'PowerplayStateReinforcement' AS INTEGER) AS PowerplayStateReinforcement,
                    CAST(message->>'PowerplayStateUndermining' AS INTEGER) AS PowerplayStateUndermining,
                    CAST(message->>'StarPos' AS DOUBLE[]) AS StarPos,
                    {to_economy_enum_proportion("message->'StationEconomies'")} AS StationEconomies,
                    {generate_enum_check(to_economy_enum("message->>'StationEconomy'"), ECONOMY, "StationEconomy")} AS StationEconomy,
                    {to_faction_state("message->'StationFaction'")} AS StationFaction,
                    {generate_enum_check(to_government_enum("message->>'StationGovernment'"), GOVERNMENT, "StationGovernment")} AS StationGovernment,
                    message->>'StationName' AS StationName,
                    CAST(message->'StationServices' AS VARCHAR[]) AS StationServices,
                    {generate_enum_check("message->>'StationType'", STATION_TYPE, "StationType")} AS StationType,
                    {generate_enum_check(to_allegiance_enum("message->>'SystemAllegiance'"), ALLEGIANCE, "SystemAllegiance")} AS SystemAllegiance,
                    {generate_enum_check(to_economy_enum("message->>'SystemEconomy'"), ECONOMY, "SystemEconomy")} AS SystemEconomy,
                    {to_faction_state("message->'SystemFaction'")} AS SystemFaction,
                    {generate_enum_check(to_government_enum("message->>'SystemGovernment'"), GOVERNMENT, "SystemGovernment")} AS SystemGovernment,
                    {generate_enum_check(to_economy_enum("message->>'SystemSecondEconomy'"), ECONOMY, "SystemSecondEconomy")} AS SystemSecondEconomy,
                    {generate_enum_check(to_security_enum("message->>'SystemSecurity'"), SECURITY, "SystemSecurity")} AS SystemSecurity,
                    {to_conflict("message->'Conflicts'")} as Conflicts,
                    rn
                FROM tmp_location_raw
            )
            INSERT INTO location (
                timestamp, StarSystem, SystemAddress, Body, BodyId, BodyType,
                DistFromStarLS, Docked, MarketID, Population, 
                PowerplayState, ControllingPower, Powers, PowerplayConflictProgress,
                PowerplayStateControlProgress, PowerplayStateReinforcement, PowerplayStateUndermining,
                StarPos,
                StationEconomies, StationEconomy, StationFaction, StationGovernment,
                StationName, StationServices, StationType, SystemAllegiance, SystemEconomy,
                SystemFaction, SystemGovernment, SystemSecondEconomy, SystemSecurity, Conflicts
            )
            SELECT
                timestamp, StarSystem, SystemAddress, Body, BodyId, BodyType,
                DistFromStarLS, Docked, MarketID, Population, 
                PowerplayState, ControllingPower, Powers, PowerplayConflictProgress,
                PowerplayStateControlProgress, PowerplayStateReinforcement, PowerplayStateUndermining,
                StarPos,
                StationEconomies, StationEconomy, StationFaction, StationGovernment,
                StationName, StationServices, StationType, SystemAllegiance, SystemEconomy,
                SystemFaction, SystemGovernment, SystemSecondEconomy, SystemSecurity, Conflicts
            FROM extracted
            WHERE rn > ?
            AND (SystemSecurity IS NOT NULL AND SystemEconomy IS NOT NULL) -- bad data
        """, [last_line])

        num_lines = get_num_lines(fpath)
        update_imported_file(conn, fname, num_lines, filesize)

def import_saasignalsfound_jsonl_files(conn, imported):
    for fname in sorted(os.listdir(DIR_DATA_DUMP)):
        should_import, fpath, filesize, last_line = should_import_file(fname, imported, required_substring="SAASignalsFound")
        if not should_import:
            continue
        print(f"Importing SAASignalsFound file {fname} from line {last_line+1}...")

        conn.execute(f"""
            WITH 
            tmp_saasignalsfound_raw AS ({create_temp_table(fpath)}),
            extracted AS (
                SELECT
                    CAST(message->>'timestamp' AS TIMESTAMP) AS timestamp,
                    message->>'StarSystem' AS StarSystem,
                    CAST(message->>'SystemAddress' AS BIGINT) AS SystemAddress,
                    CAST(message->>'BodyID' AS INTEGER) AS BodyId,
                    message->>'BodyName' AS BodyName,
                    list_transform(CAST(message->'Genuses' AS JSON[]), x -> struct_pack(Genus := x->>'Genus')) AS Genuses,
                    {to_count_signal_type_enum("message->'Signals'")} AS Signals,
                    CAST(message->>'StarPos' AS DOUBLE[]) AS StarPos,
                    rn
                FROM tmp_saasignalsfound_raw
            )
            INSERT INTO saasignalsfound (
                timestamp, StarSystem, SystemAddress, BodyId, BodyName,
                Genuses, Signals, StarPos
            )
            SELECT
                timestamp, StarSystem, SystemAddress, BodyId, BodyName,
                Genuses, Signals, StarPos
            FROM extracted
            WHERE rn > ?
        """, [last_line])

        num_lines = get_num_lines(fpath)
        update_imported_file(conn, fname, num_lines, filesize)

def import_fsssignaldiscovered_jsonl_files(conn, imported):
    for fname in sorted(os.listdir(DIR_DATA_DUMP)):
        should_import, fpath, filesize, last_line = should_import_file(fname, imported, required_substring="FSSSignalDiscovered")
        if not should_import:
            continue
        print(f"Importing fsssignaldiscovered file {fname} from line {last_line+1}...")

        conn.execute(f"""
            WITH 
            tmp_fsssignaldiscovered_raw AS ({create_temp_table(fpath)}),
            extracted AS (
                SELECT
                    CAST(message->>'timestamp' AS TIMESTAMP) AS timestamp,
                    message->>'StarSystem' AS StarSystem,
                    CAST(message->>'SystemAddress' AS BIGINT) AS SystemAddress,
                    list_transform(
                        CAST(message->'signals' AS JSON[]),
                        s -> struct_pack(
                            IsStation := s->>'IsStation' = 'true',
                            SignalName := s->>'SignalName',
                            SignalType := {generate_enum_check("CASE WHEN s ->>'SignalType' = '' THEN 'Empty' ELSE s->>'SignalType' END", FSS_SIGNAL_TYPE, "SignalType")}
                        )
                    ) AS Signals,
                    rn
                FROM tmp_fsssignaldiscovered_raw
            )
            INSERT OR REPLACE INTO fsssignaldiscovered_latest (
                timestamp, StarSystem, SystemAddress, Signals
            )
            SELECT
                DISTINCT ON (SystemAddress) timestamp, StarSystem, SystemAddress, Signals
            FROM extracted
            WHERE rn > ?
            ORDER BY timestamp DESC
        """, [last_line])

        num_lines = get_num_lines(fpath)
        update_imported_file(conn, fname, num_lines, filesize)


def import_systemspopulated(conn, imported):
    fname = "systemsPopulated.json.gz"
    fpath = os.path.join(DIR_DATA_DUMP, fname)
    if not os.path.exists(fpath):
        print(f"{fpath} not found.")
        return
    
    filesize = os.path.getsize(fpath)
    old_filesize = imported.get(fname.removesuffix(".gz"), {}).get("filesize", None)
    if old_filesize == filesize:
        print(f"Skipping {fname}: file size unchanged.")
        return
    
    print(f"Importing {fname}...")

    conn.execute(f"""
        WITH tmp_systemspopulated AS (
            SELECT
                CAST(id64 AS BIGINT) AS Id64,
                name AS Name,
                [coords->>'x', coords->>'y', coords->>'z'] AS StarPos,
                bodies AS Bodies
            FROM read_json_auto('{fpath}')
        )
        INSERT OR REPLACE INTO systems_populated (Id64, Name, StarPos, Bodies)
        SELECT DISTINCT ON (Id64) Id64, Name, StarPos, Bodies
        FROM tmp_systemspopulated
    """)

    update_imported_file(conn, fname, 0, os.path.getsize(fpath))


def main():
    conn = connect_db()
    create_schema(conn)
    
    imported = get_imported_files(conn)

    # systems dump from EDSM
    import_systemspopulated(conn, imported)

    # mix of permanent info (like stations) and transient info (like powerplay)
    import_jump_jsonl_files(conn, imported)
    import_approachsettlement_jsonl_files(conn, imported)
    import_docked_jsonl_files(conn, imported)
    import_location_jsonl_files(conn, imported)
    
    # permanent info about hotspots, and biological/geological signals.
    import_saasignalsfound_jsonl_files(conn, imported)
    
    # transient info (only keep latest info per entry)
    import_commodity_jsonl_files(conn, imported)
    # transient info about signals in fss (also contains permanent info e.g. stations, but nothing useful)
    # this'd be mostly useful for tracking CZs, HazRes and PCZs.
    import_fsssignaldiscovered_jsonl_files(conn, imported)

    # this is all permanent info about bodies and number of biological/geo signals, but we don't need it.
    # import_fssbodysignals_jsonl_files(conn, imported)

    conn.execute("CHECKPOINT;")
    conn.close()


if __name__ == "__main__":
    main()

