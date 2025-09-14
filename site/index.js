import { registerApp } from "./app/app.js";

import * as duckdbduckdbWasm from "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/+esm";

window.duckdbduckdbWasm = duckdbduckdbWasm;


// --- Lazy DuckDB connection singleton ---
let _db = null;
let _conn = null;
let _connPromise = null;
let _attachedTimestamp = null;
let _counter = 0;

export async function getDb() {
    if (_db) return _db;

    const duckdb = window.duckdbduckdbWasm;
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], {
            type: "text/javascript",
        })
    );

    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(worker_url);
    await db.open();
    _db = db;
    return db;
}

function getUrl(filename) {
    return location.hostname === "localhost"
        ? `http://localhost:8000/${filename}`
        : `https://control-point.pages.dev/${filename}`;
}

export async function getDbConn() {
    const manifestUrl = getUrl("site-data_manifest.json");
    const response = await fetch(manifestUrl);
    const manifest = await response.json();
    const newTimestamp = manifest.generated_at;
    const db_name = manifest.db_name;

    if (_connPromise && _attachedTimestamp === newTimestamp) {
        return _connPromise;
    }

    // timestamp changed. Refresh DB.
    if (_connPromise) {
        _connPromise = null;
    }

    _attachedTimestamp = newTimestamp;
    _connPromise = (async () => {
        
        const db = await getDb();
        if (_conn) await _conn.close();
        const conn = await db.connect();

        const attachUrl = getUrl(db_name);
        
        if (_counter > 0)
            await conn.query(`DETACH DATABASE db${_counter};`).catch((e) => {
                console.log("Error detaching previous database", e);
            });
        _counter++;
        console.log(`Attaching database from ${attachUrl}`);
        await conn.query(`ATTACH '${attachUrl}' as db${_counter} (READ_ONLY); USE db${_counter};`);
        // const attachedDbs = await conn.query(`SHOW DATABASES`);
        // console.log("Attached databases:", attachedDbs.toArray().map(r => r.toJSON()));
        _conn = conn;
        return conn;
    })();

    return _connPromise;
}

const app = () => {
    registerApp();

    const template = document.querySelector('template#page');
    if (template) document.body.appendChild(template.content, true);
}

document.addEventListener('DOMContentLoaded', app);