import duckdb
import shutil
import os

from constants import DB_PATH

old_db = DB_PATH
new_db = 'compressed.duckdb'

# no filename arg = in-memory database
con = duckdb.connect()
con.execute(f"""
    ATTACH '{old_db}' AS db1;
    ATTACH '{new_db}' AS db2;
    COPY FROM DATABASE db1 TO db2;
    """)

con.close()

os.remove(old_db)
shutil.move(new_db, old_db)