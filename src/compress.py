import duckdb
import shutil
import os

def compress_database(db):
    print(f"Compressing database {db} ...", end="")
    # no filename arg = in-memory database
    new_db = 'temp.duckdb'
    con = duckdb.connect()
    con.execute(f"""
        ATTACH '{db}' AS db1;
        ATTACH '{new_db}' AS db2;
        COPY FROM DATABASE db1 TO db2;
        """)
    con.close()

    os.remove(db)
    shutil.move(new_db, db)
    print(f"Done.")