import { registerApp } from "./app/app.js";

import * as duckdbduckdbWasm from "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/+esm";

window.duckdbduckdbWasm = duckdbduckdbWasm;


// --- Lazy DuckDB connection singleton ---
let _db = null;
let _conn = null;
let _connPromise = null;
let _attachedTimestamp = null;

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

    if (_conn && _attachedTimestamp === newTimestamp) {
        return _conn;
    }

    if (_connPromise && _attachedTimestamp === newTimestamp) {
        return _connPromise;
    }

    // timestamp changed. Refresh everything.
    if (_conn ||_connPromise) {
        _conn = null;
        _connPromise = null;
        location.reload();
    }

    _attachedTimestamp = newTimestamp;
    _connPromise = (async () => {
        const db = await getDb();
        const conn = await db.connect();
        const attachUrl = getUrl("site-data.duckdb");
        console.log(`Attaching database from ${attachUrl}`);
        await conn.query(`ATTACH '${attachUrl}' as db (READ_ONLY); USE db;`);       
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