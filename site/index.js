import { registerApp } from "./app/app.js";

import * as duckdbduckdbWasm from "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/+esm";

window.duckdbduckdbWasm = duckdbduckdbWasm;


// --- Lazy DuckDB connection singleton ---
let _db = null;
let _conn = null;
let _attached = false;
let _dbPromise = null;
let _connPromise = null;

export async function getDb() {
    if (_db) return _db;
    if (_dbPromise) return _dbPromise;
    _dbPromise = (async () => {
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
        window._db = db;
        _db = db;
        return db;
    })();
    return _dbPromise;
}

export async function getDbConn() {
    if (_conn) return _conn;
    if (_connPromise) return _connPromise;
    _connPromise = (async () => {
        const db = await getDb();
        await db.open();
        const conn = await db.connect();
        if (!_attached) {
            const attachUrl = location.hostname === "localhost"
                ? "http://localhost:8000/systems.duckdb"
                : "https://control-point.pages.dev/systems.duckdb";
            await conn.query(`ATTACH '${attachUrl}' as db (READ_ONLY);`);
            _attached = true;
        }
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