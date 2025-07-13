import { getDbConn } from "../index.js";

class InfraFailuresComponent extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `<div class="infra-failures">Loading...</div>`;
        this.container = this.querySelector('.infra-failures');
        this.rows = [];
    }

    async connectedCallback() {
        await this.loadData();
    }

    async onActive() {
        await this.loadData();
    }

    async loadData() {
        try {
            const conn = await getDbConn();
            const stmt = await conn.prepare(`SELECT * FROM db.infra_failures;`);
            const result = await stmt.query();
            this.rows = result.toArray().map(row => row.toJSON());

            if (this.rows.length === 0) {
                this.container.innerHTML = `<p>No infra failures found.</p>`;
                return;
            }

            this.renderTable();
        } catch (err) {
            console.error("Error loading infra failures:", err);
            this.container.innerHTML = `<p>Error loading infra failures data.</p>`;
        }
    }

    renderTable(sortColumn = null, sortDirection = 'asc') {
        if (sortColumn) {
            this.rows.sort((a, b) => {
                const valueA = a[sortColumn];
                const valueB = b[sortColumn];

                if (typeof valueA === 'string') {
                    return sortDirection === 'asc'
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                } else if (typeof valueA === 'number' || valueA instanceof Date) {
                    return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
                }
                return 0;
            });
        }

        const tableHeaders = `
            <thead>
                <tr>
                    <th data-column="StarSystem" data-direction="${sortColumn === 'StarSystem' ? sortDirection : ''}">
                        System ${sortColumn === 'StarSystem' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th data-column="StationName" data-direction="${sortColumn === 'StationName' ? sortDirection : ''}">
                        Station ${sortColumn === 'StationName' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th data-column="FactionName" data-direction="${sortColumn === 'FactionName' ? sortDirection : ''}">
                        Faction ${sortColumn === 'FactionName' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th>Commodities</th>
                    <th data-column="InfraFailTimestamp" data-direction="${sortColumn === 'InfraFailTimestamp' ? sortDirection : ''}">
                        Faction Update ${sortColumn === 'InfraFailTimestamp' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th data-column="MarketTimestamp" data-direction="${sortColumn === 'MarketTimestamp' ? sortDirection : ''}">
                        Market Update ${sortColumn === 'MarketTimestamp' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                </tr>
            </thead>
        `;

        const tableRows = this.rows.map(row => {
            const commoditiesTable = `
                <table class="nested-table">
                    ${row.Commodities.toArray()
                        .map(c => c.toJSON())
                        .sort((a, b) => {
                            if (a[0] < b[0]) return -1;
                            if (a[0] > b[0]) return 1;
                            return 0;
                        })
                        .map(commodity => {
                            return `
                                <tr>
                                    <td>${commodity[0]}</td>
                                    <td>${commodity[2]}</td>
                                    <td>${commodity[1]}</td>
                                </tr>
                            `;
                        }).join('')}
                </table>
            `;

            return `
                <tr>
                    <td>${row.StarSystem}</td>
                    <td>${row.StationName}</td>
                    <td>${row.FactionName}</td>
                    <td>${commoditiesTable}</td>
                    <td>${new Date(row.InfraFailTimestamp).toLocaleString(undefined, {dateStyle: "short", timeStyle: "short"})}</td>
                    <td>${new Date(row.MarketTimestamp).toLocaleString()}</td>
                </tr>
            `;
        }).join('');

        this.container.innerHTML = `
            <table class="infra-failures-table">
                ${tableHeaders}
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;

        this.container.querySelectorAll('th[data-column]').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-column');
                const currentDirection = header.getAttribute('data-direction') || 'asc';
                const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

                this.renderTable(column, newDirection);
            });
        });
    }
}

export function registerInfraFailuresComponent() {
    customElements.define('x-infra-failures', InfraFailuresComponent);
}