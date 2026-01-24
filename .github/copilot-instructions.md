# ED Control Point - AI Coding Agent Instructions

## Project Overview
Elite Dangerous Powerplay 2.0 helper application that processes EDDN (Elite Dangerous Data Network) data to provide strategic insights for Li Yong-Rui faction activities. The system consists of Python ETL pipeline + client-side DuckDB-WASM web application.

## Architecture & Data Flow

### Core Pipeline (`src/go.py`)
```
Download → Import → Compress → Report → Deploy
```
1. **Download**: `dl_today.py` + `dl_hist.py` fetch JSONL files from edgalaxydata.space
2. **Import**: `import_.py` processes EDDN events into `data.duckdb` 
3. **Report**: `report.py` creates optimized `sitedata_*.duckdb` for web consumption
4. **Deploy**: Files copied to `site/` with manifest for cache-busting

### Key Data Sources
- **EDDN Events**: Commodity prices, system jumps, station docking, settlement approaches
- **EDSM**: Systems population data from `systemsPopulated.json.gz`
- **Event Types**: Defined in `constants.py` EVENT_TYPES array

### Frontend Architecture
- **No Framework**: Vanilla JS with custom web components (`x-*` elements)
- **DuckDB-WASM**: Client-side SQL queries against compressed database
- **Lazy Loading**: Database connections created on-demand with cache invalidation
- **Routing**: Hash-based SPA routing via `components/route.js`

## Development Patterns

### Environment Setup (Poetry 2.2+)
- Python version: target 3.10–3.12; avoid 3.13+ until DuckDB wheels exist.
- On Windows, point Poetry at a specific interpreter: `poetry env use C:\\Users\\kurts\\AppData\\Local\\Python\\pythoncore-3.12-64\\python.exe` (adjust if path changes).
- The modules install directly when you run `poetry install`; typically no `PYTHONPATH` tweak is needed. If a `python -m go` import error appears in a fresh shell, set `PYTHONPATH=$PWD/src` or add `poetry config virtualenvs.options.env.PYTHONPATH "$PWD/src"` as a fallback.

### Database Schema (`src/db.py`)
- Enums for game constants (POWER, ALLEGIANCE, ECONOMY, etc.)
- Foreign key relationships between systems, stations, commodities
- Import tracking via `imported_files` table with resume capability

### Import Pattern (`src/import_.py`)
```python
# Standard pattern for JSONL processing
def import_X_jsonl_files(conn, imported):
    for fname in sorted(os.listdir(DIR_DATA_DUMP)):
        should_import, fpath, filesize, last_line = should_import_file(fname, imported, "EventType")
        if not should_import: continue
        # Process with temp table + SQL transformation
```

### Web Component Pattern (`site/components/`)
```javascript
class XComponentName extends HTMLElement {
    async connectedCallback() {
        const conn = await getDbConn();  // Always use this for DB access
        const result = await conn.query("SELECT...");
        this.innerHTML = `...`;
    }
}
customElements.define('x-component-name', XComponentName);
```

## Critical Commands & Workflows

### Local Development

Activate the python environment first using poetry, or use `poetry run` before each command.

```bash
# Full pipeline run
python -m go

# Individual steps
python -m dl_today        # Download today's data
python -m import_         # Import to database  
python -m report          # Generate site database

# Serve locally (required for DuckDB-WASM CORS)
python -m localhttp -d site/
```

### Database Operations
- **Main DB**: `data.duckdb` (all raw data, ~GB scale)
- **Site DB**: `site/sitedata_*.duckdb` (optimized queries, ~MB scale)
- **Schema**: Always call `create_schema(conn)` before imports

### Cache Management
- `src/upload_cache_r2.py`: Upload to R2 for CI cache seeding
- `src/clean.py`: Local cleanup with configurable retention
- `src/clean_github.py`: Aggressive cleanup for CI environments

## Project-Specific Conventions

### File Naming & Structure
- **JSONL Files**: `EventType-YYYY-MM-DD.jsonl[.gz/.bz2]`
- **Metadata**: `.lastmodified` files track incremental downloads
- **Site Assets**: Database + manifest in `site/` for direct serving

### PowerPlay Domain Logic
- **Control Points**: Core currency in PP 2.0 system
- **Activities**: Defined in `site/utils/activities.js` with merit calculations
- **Systems**: Strategic value based on reinforcement/undermining potential
- **Infrastructure Failures**: High-value targets tracked via market data

### Database Queries
- Use parameterized queries via DuckDB's `?` placeholders
- Prefer CTEs for complex transformations
- Always include system timestamp filters for performance

## External Dependencies

### Runtime
- **DuckDB**: Core database engine (Python + WASM versions)
- **EDDN**: Real-time game data via HTTP polling
- **Cloudflare Pages**: Static hosting with R2 object storage

### Development
- **Poetry**: Python dependency management (`pyproject.toml`)
- **No Build System**: Direct ES modules in browser
- **Manual Deployments**: Via R2 upload scripts

## Testing & Debugging
- **Notebooks**: Use `nb/*.dbcnb` for SQL exploration
- **Local Server**: Always test via `localhttp.py` (CORS requirements)
- **Data Validation**: Check `imported_files` table for processing status
- **Performance**: Monitor query execution time in browser DevTools

## Common Pitfalls
- **CORS Issues**: Never serve DuckDB files via `file://` protocol
- **Memory Limits**: Site database must stay under ~50MB for browser performance  
- **Date Handling**: EDDN timestamps are UTC strings, convert appropriately
- **Incremental Downloads**: Always check `.lastmodified` files before full re-download