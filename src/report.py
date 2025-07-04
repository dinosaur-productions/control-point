import duckdb
import os

from constants import DB_SYSTEMS_PATH



def make_report_db():
    if os.path.exists(DB_SYSTEMS_PATH):
        os.remove(DB_SYSTEMS_PATH)
    print(f"Creating report database at {DB_SYSTEMS_PATH} ...", end="")
    out_con = duckdb.connect(DB_SYSTEMS_PATH)
    out_con.execute("ATTACH 'data.duckdb' as db (READ_ONLY);")
    out_con.execute("""
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
                    COALESCE(PowerplayState, 'Unoccupied') AS PowerplayState, 
                    PowerplayStateControlProgress,
                    COALESCE(Powers, []) AS Powers,
                    PowerplayStateReinforcement, PowerplayStateUndermining, PowerplayConflictProgress,
                    CASE 
                        WHEN ControllingPower = 'Li Yong-Rui' THEN
                            CASE
                                WHEN PowerplayState = 'Exploited' AND PowerplayStateControlProgress < 1 THEN 'Reinforce'
                                WHEN PowerplayState = 'Fortified' AND PowerplayStateControlProgress < 1.25 THEN 'Reinforce'
                                WHEN PowerplayState = 'Stronghold' THEN 'Reinforce'
                                ELSE 'Wait Until Next Cycle'
                            END
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
            WHERE Activity NOT IN ('No Powerplay Data')
    """)
    out_con.close()
    print("Done.")

if __name__ == "__main__":
    make_report_db()