import { getInfraFailures, getSystemByAddress } from "../utils/data-access.js";

class InfraFailuresComponent extends HTMLElement {
    static get observedAttributes() {
        return ['origin-system'];
    }

    constructor() {
        super();
        this.innerHTML = `
            <div class="infra-failures">
                <div class="loading">Loading...</div>
                <x-sortable-table style="display: none;"></x-sortable-table>
            </div>
        `;
        this.container = this.querySelector('.infra-failures');
        this.loadingElement = this.querySelector('.loading');
        this.table = this.querySelector('x-sortable-table');
        this.rows = [];
        this.originSystemAddress = null;
        this.originSystemName = null;
    }

    async connectedCallback() {
        await this.loadData();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'origin-system' && oldValue !== newValue) {
            this.loadData();
        }
    }

    async onActive() {
        // Always reload data when component becomes active (via route or direct URL)
        await this.loadData();
    }

    getOriginSystemAddress() {
        return this.getAttribute('origin-system') || '3824408316259'; // Lembava SystemAddress
    }

    async loadData() {
        this.originSystemAddress = this.getOriginSystemAddress();
        this.originSystemName = await getSystemByAddress(this.originSystemAddress).then(row => row ? row.StarSystem : 'Unknown');
        
        try {
            this.rows = await getInfraFailures(this.originSystemAddress);

            if (this.rows.length === 0) {
                this.loadingElement.innerHTML = `<p>No infra failures found.</p>`;
                return;
            }

            this.renderTable();
        } catch (err) {
            console.error("Error loading infra failures:", err);
            this.loadingElement.innerHTML = `<p>Error loading infra failures data.</p>`;
        }
    }

    renderTable(sortColumn = null, sortDirection = 'asc') {
        // Set up table headers
        this.table.setHeaders([
            { key: 'StarSystem', label: 'System', sortable: true },
            { key: 'StationName', label: 'Station', sortable: true },
            { key: 'FactionName', label: 'Faction', sortable: true },
            { key: 'Commodities', label: 'Commodities', sortable: false },
            { key: 'ControllingPower', label: 'Power', sortable: true },
            { key: 'PowerplayState', label: 'State', sortable: true },
            { key: 'InfraFailTimestamp', label: 'Faction Update', sortable: true },
            { key: 'MarketTimestamp', label: 'Market Update', sortable: true },
            { key: 'Distance', label: `Dist ${this.originSystemName}`, sortable: true }
        ]);

        // Process and add rows
        const processedRows = this.rows.map(row => {
            // Generate commodities table
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

            // Generate external links using Web Components
            const systemLinks = `<x-external-links system-name="${row.StarSystem}" system-address="${row.SystemAddress}"></x-external-links>`;
            const stationLinks = `<x-external-links station-name="${row.StationName}" station-system="${row.StarSystem}" station-market-id="${row.MarketId}"></x-external-links>`;
            const factionLinks = `<x-external-links faction-name="${row.FactionName}"></x-external-links>`;

            return {
                StarSystem: `${row.StarSystem}${systemLinks}`,
                StationName: `${row.StationName}${stationLinks}`,
                FactionName: `${row.FactionName}${factionLinks}`,
                Commodities: commoditiesTable,
                ControllingPower: row.ControllingPower || '',
                PowerplayState: row.PowerplayState || '',
                InfraFailTimestamp: new Date(row.InfraFailTimestamp).toLocaleString(undefined, {dateStyle: "short", timeStyle: "short"}),
                MarketTimestamp: new Date(row.MarketTimestamp).toLocaleString(),
                Distance: row.Distance
            };
        });

        // Set rows in table
        this.table.setRows(processedRows);

        // Apply sorting if specified
        if (sortColumn) {
            this.table.sort(sortColumn, sortDirection);
        }

        // Show table and hide loading
        this.loadingElement.style.display = 'none';
        this.table.style.display = 'block';
    }
}

export function registerInfraFailuresComponent() {
    customElements.define('x-infra-failures', InfraFailuresComponent);
}