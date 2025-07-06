import { getDbConn } from "../index.js";

class SystemActivityComponent extends HTMLElement {
    static get observedAttributes() {
        return ['system-address'];
    }

    constructor() {
        super();
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

            // Format the last update time
            const lastUpdateDate = new Date(row.LastUpdate);
            const timeAgo = this.getTimeAgo(row.LastUpdate);

            // Format control progress as a percentage
            const controlProgress = row.PowerplayStateControlProgress
                ? `${Math.floor(row.PowerplayStateControlProgress * 100)}%`
                : null;

            // Format PowerplayConflictProgress
            let conflictProgress = '';
            if (row.PowerplayConflictProgress && typeof row.PowerplayConflictProgress.toArray === 'function') {
                const conflicts = row.PowerplayConflictProgress.toArray();
                conflictProgress = conflicts.map(conflict => {
                    const points = Math.floor(conflict.ConflictProgress * 120000);
                    return `<p>${conflict.Power}: ${points}</p>`;
                }).join('');
            }

            // Check if Powers array is empty
            const powers = row.Powers && typeof row.Powers.toArray === 'function' ? row.Powers.toArray() : [];
            const powersLine = powers.length > 0 ? `<p>In range of: ${powers.join(', ')}</p>` : '';

            // Build the new layout
            this.container.innerHTML = `
                <div class="system-info">
                    <p style="text-align: center; font-size: 1.5rem; font-weight: bold;">
                        ${row.StarSystem}
                    </p>
                    <p style="text-align: center; font-size: 1.5rem;">
                        <strong>${row.Activity}</strong>
                    </p>
                    ${row.ControllingPower || row.PowerplayState || controlProgress ? `
                        <p>${row.ControllingPower || ''} ${row.PowerplayState || ''} ${controlProgress || ''}</p>
                    ` : ''}
                    ${['Exploited', 'Fortified', 'Stronghold'].includes(row.PowerplayState) ? `
                        <p>Reinforcement:${row.PowerplayStateReinforcement || 'N/A'}, 
                        Undermining: ${row.PowerplayStateUndermining || 'N/A'}</p>
                    ` : ''}
                    ${conflictProgress}
                    ${powersLine}
                    <p>Updated ${timeAgo} at ${lastUpdateDate.toLocaleString(undefined, {dateStyle: "short", timeStyle:"short"})}</p>
                </div>
            `;
        } catch (err) {
            this.container.textContent = "Unexpected error.";
            console.error(err);
        }
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    }
}

export function registerSystemActivityComponent() {
    customElements.define('x-system-activity', SystemActivityComponent);
}