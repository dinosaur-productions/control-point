import { getDbConn } from "../index.js";
import { registerAutoCompleteComponent } from "../components/autocomplete.js";

class SystemSearchComponent extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `<x-autocomplete></x-autocomplete>`;
        this.ac = this.querySelector('x-autocomplete');
    }

    connectedCallback() {
        this.init();
    }

    async init() {
        this.ac.setLoading(true);
        const conn = await getDbConn();
        this.ac.setLoading(false);

        // Prepare statement for autocomplete
        const stmt = await conn.prepare(
            `SELECT StarSystem,SystemAddress FROM db.systems WHERE LOWER(StarSystem) ILIKE ? LIMIT 10;`
        );

        this.ac.addEventListener('search', async (e) => {
            const val = e.detail;
            if (!val) {
                this.ac.setOptions([]);
                return;
            }
            const result = await stmt.query(`${val}%`);
            const options = result.toArray().map(row => row.toJSON());
            this.ac.setOptions(options);
        });

        this.ac.addEventListener('select', (e) => {
            const selected = e.detail;
            if (selected && selected.SystemAddress) {
                window.location.href = `#/system/${encodeURIComponent(selected.SystemAddress)}`;
            }
        });
    }
}


export function registerSystemSearchComponent() {
    registerAutoCompleteComponent();
    customElements.define('x-system-search', SystemSearchComponent);
}