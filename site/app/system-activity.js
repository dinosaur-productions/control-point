import { getDbConn } from "../index.js";

class SystemActivityComponent extends HTMLElement {
    static get observedAttributes() {
        return ['system-address'];
    }

    constructor() {
        super();
        // No shadow DOM, use light DOM
        this.innerHTML = `<div class="system-activity">Loading...</div>`;
        this.container = this.querySelector('.system-activity');
    }

    connectedCallback() {
        this.loadData();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'system-address' && oldValue !== newValue) {
            this.loadData();
        }
    }

    async loadData() {
        const systemAddress = this.getAttribute('system-address');
        if (!systemAddress) {
            this.container.textContent = "No system selected.";
            return;
        }
        let numSystemAddress = Number(systemAddress);
        this.container.textContent = "Loading system data...";
        try {
            const conn = await getDbConn();
            const stmt = await conn.prepare(
                `SELECT * FROM db.systems WHERE SystemAddress = ?;`
            );
            const result = await stmt.query(numSystemAddress);

            const rows = result.toArray().map(row => row.toJSON());
            if (rows.length === 0) {
                this.container.textContent = "System not found.";
                return;
            }
            const row = rows[0];
            this.container.innerHTML = `
                <h3>System: ${row.StarSystem || row.Name || systemAddress}</h3>
                <table>
                    <tbody>
                        ${Object.entries(row).map(([k, v]) =>
                            `<tr><td><strong>${k}</strong></td><td>${typeof v === "object" ? JSON.stringify(v) : v}</td></tr>`
                        ).join('')}
                    </tbody>
                </table>
            `;
        } catch (err) {
            this.container.textContent = "Error loading system data.";
            console.error(err);
        }
    }
}

export function registerSystemActivityComponent() {
    customElements.define('x-system-activity', SystemActivityComponent);
}