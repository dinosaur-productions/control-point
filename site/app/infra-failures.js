import { getInfraFailures, getSystemByAddress } from "../utils/data-access.js";
import { inaraSystemByName, inaraStation, inaraMinorFaction, spanshSystem, spanshStation } from "../utils/links.js";
import { SortableTable } from "../utils/tables.js";

class InfraFailuresComponent extends HTMLElement {
    static get observedAttributes() {
        return ['origin-system'];
    }

    constructor() {
        super();
        this.innerHTML = `<div class="infra-failures">Loading...</div>`;
        this.container = this.querySelector('.infra-failures');
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
        // Component will reload automatically via attributeChangedCallback if needed
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
        // Create table with headers
        const table = new SortableTable([
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

        // Add rows with processed data
        this.rows.forEach(row => {
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

            // Generate links for system
            const systemInaraLink = inaraSystemByName(row.StarSystem);
            const systemSpanshLink = spanshSystem(row.SystemAddress);
            
            // Generate links for station
            const stationInaraLink = inaraStation(row.StationName, row.StarSystem);
            const stationSpanshLink = spanshStation(row.MarketId);
            
            // Generate links for faction
            const factionInaraLink = inaraMinorFaction(row.FactionName);

            table.addRow({
                StarSystem: `
                    ${row.StarSystem}
                    <span class="external-links">
                        <a href="${systemInaraLink}" target="_blank" title="View system on Inara" class="link-icon inara">I</a>
                        <a href="${systemSpanshLink}" target="_blank" title="View system on Spansh" class="link-icon spansh">S</a>
                    </span>
                `,
                StationName: `
                    ${row.StationName}
                    <span class="external-links">
                        <a href="${stationInaraLink}" target="_blank" title="View station on Inara" class="link-icon inara">I</a>
                        <a href="${stationSpanshLink}" target="_blank" title="View station on Spansh" class="link-icon spansh">S</a>
                    </span>
                `,
                FactionName: `
                    ${row.FactionName}
                    <span class="external-links">
                        <a href="${factionInaraLink}" target="_blank" title="View faction on Inara" class="link-icon inara">I</a>
                    </span>
                `,
                Commodities: commoditiesTable,
                ControllingPower: row.ControllingPower || '',
                PowerplayState: row.PowerplayState || '',
                InfraFailTimestamp: new Date(row.InfraFailTimestamp).toLocaleString(undefined, {dateStyle: "short", timeStyle: "short"}),
                MarketTimestamp: new Date(row.MarketTimestamp).toLocaleString(),
                Distance: row.Distance
            });
        });

        // Apply sorting if specified
        if (sortColumn) {
            table.sort(sortColumn, sortDirection);
        }

        // Render table
        this.container.innerHTML = `<div class="table-container">${table.getHTML()}</div>`;
        
        // Attach sort listeners
        table.attachSortListeners(this.container.querySelector('.table-container'));
    }
}

export function registerInfraFailuresComponent() {
    customElements.define('x-infra-failures', InfraFailuresComponent);
}