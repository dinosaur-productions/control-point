import { getInfraFailures, getSystemByAddress } from "../data-access.js";
import { inaraSystemByName, inaraStation, inaraMinorFaction, spanshSystem, spanshStation } from "../links.js";

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
                    <th data-column="Distance" data-direction="${sortColumn === 'Distance' ? sortDirection : ''}">
                        Distance ${sortColumn === 'Distance' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
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

            // Generate links for system
            const systemInaraLink = inaraSystemByName(row.StarSystem);
            const systemSpanshLink = spanshSystem(row.SystemAddress);
            
            // Generate links for station
            const stationInaraLink = inaraStation(row.StationName, row.StarSystem);
            const stationSpanshLink = spanshStation(row.MarketId);
            
            // Generate links for faction
            const factionInaraLink = inaraMinorFaction(row.FactionName);

            return `
                <tr>
                    <td>
                        ${row.StarSystem}
                        <span class="external-links">
                            <a href="${systemInaraLink}" target="_blank" title="View system on Inara" class="link-icon inara">I</a>
                            <a href="${systemSpanshLink}" target="_blank" title="View system on Spansh" class="link-icon spansh">S</a>
                        </span>
                    </td>
                    <td>
                        ${row.StationName}
                        <span class="external-links">
                            <a href="${stationInaraLink}" target="_blank" title="View station on Inara" class="link-icon inara">I</a>
                            <a href="${stationSpanshLink}" target="_blank" title="View station on Spansh" class="link-icon spansh">S</a>
                        </span>
                    </td>
                    <td>
                        ${row.FactionName}
                        <span class="external-links">
                            <a href="${factionInaraLink}" target="_blank" title="View faction on Inara" class="link-icon inara">I</a>
                        </span>
                    </td>
                    <td>${commoditiesTable}</td>
                    <td>${new Date(row.InfraFailTimestamp).toLocaleString(undefined, {dateStyle: "short", timeStyle: "short"})}</td>
                    <td>${new Date(row.MarketTimestamp).toLocaleString()}</td>
                    <td>${row.Distance} ly</td>
                </tr>
            `;
        }).join('');
            //
        this.container.innerHTML = `
            <p style="margin-bottom: 10px; font-style: italic;">Distances calculated from: <strong>${this.originSystemName}</strong></p>
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