import { getDbConn } from '../index.js';
import { searchSystems } from "../utils/data-access.js";

class SettlementsComponent extends HTMLElement {
    static get observedAttributes() {
        return ['system-address'];
    }

    constructor() {
        super();
        this.innerHTML = `<div class="settlements-container">Loading...</div>`;
        this.container = this.querySelector('.settlements-container');
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
            this.renderSearchUI();
            return;
        }

        this.container.textContent = "Loading settlements...";
        
        try {
            const conn = await getDbConn();
            
            // First get the system name
            const systemStmt = await conn.prepare(`
                SELECT StarSystem 
                FROM systems 
                WHERE SystemAddress = ?
                LIMIT 1
            `);
            const systemQuery = await systemStmt.query(systemAddress);
            
            const systemRows = systemQuery.toArray();
            if (systemRows.length === 0) {
                this.container.textContent = "System not found.";
                return;
            }
            
            const systemName = systemRows[0].StarSystem;
            
            // Get settlements for this system
            const settlementsStmt = await conn.prepare(`
                SELECT 
                    StationName,
                    MarketId,
                    BodyName,
                    StationEconomy,
                    StationGovernment,
                    FactionName,
                    LandingPads
                FROM settlements
                WHERE SystemAddress = ?
                ORDER BY StationName
            `);
            const settlementsQuery = await settlementsStmt.query(systemAddress);
            
            const settlements = settlementsQuery.toArray().map(row => row.toJSON());
            
            this.renderSettlements(systemName, systemAddress, settlements);
        } catch (err) {
            this.container.textContent = "Error loading settlements.";
            console.error(err);
        }
    }

    renderSearchUI() {
        this.container.innerHTML = `
            <div class="settlements-search">
                <p>Search for a system to view its on-foot settlements:</p>
                <x-autocomplete placeholder="Enter system name..."></x-autocomplete>
            </div>
        `;
        
        const ac = this.container.querySelector('x-autocomplete');
        
        // Initialize autocomplete
        (async () => {
            ac.setLoading(true);
            await searchSystems("__init__");
            ac.setLoading(false);

            ac.addEventListener('search', async (e) => {
                const val = e.detail;
                if (!val) {
                    ac.setOptions([]);
                    return;
                }
                const options = await searchSystems(val);
                ac.setOptions(options);
            });

            ac.addEventListener('select', (e) => {
                const selected = e.detail;
                if (selected && selected.SystemAddress) {
                    window.location.href = `#/settlements/${encodeURIComponent(selected.SystemAddress)}`;
                }
            });
        })();
    }

    renderSettlements(systemName, systemAddress, settlements) {
        if (settlements.length === 0) {
            this.container.innerHTML = `
                <div class="settlements-content">
                    <p>No on-foot settlements found in ${systemName}.</p>
                    <button onclick="window.location.href='#/settlements'">Search another system</button>
                </div>
            `;
            return;
        }
        
        this.container.innerHTML = `
            <div class="settlements-content">
                <div class="settlements-header">
                    <x-external-links system-name="${systemName}" system-address="${systemAddress}"></x-external-links>
                    <button onclick="window.location.href='#/settlements'">Search another system</button>
                </div>
                <x-sortable-table></x-sortable-table>
                <p class="settlements-count">Total: ${settlements.length} settlement${settlements.length === 1 ? '' : 's'}</p>
            </div>
        `;
        
        const table = this.container.querySelector('x-sortable-table');
        
        // Set up table headers
        table.setHeaders([
            { key: 'StationName', label: 'Settlement Name', sortable: true },
            { key: 'BodyName', label: 'Body', sortable: true },
            { key: 'FactionName', label: 'Faction', sortable: true },
            { key: 'StationEconomy', label: 'Economy', sortable: true },
            { key: 'StationGovernment', label: 'Government', sortable: true },
            { key: 'LandingPads', label: 'Landing Pads', sortable: false }
        ]);
        
        // Process and add rows
        const processedRows = settlements.map(settlement => {
            const pads = settlement.LandingPads || { Large: 0, Medium: 0, Small: 0 };
            const padInfo = `L: ${pads.Large || 0}, M: ${pads.Medium || 0}, S: ${pads.Small || 0}`;
            const marketIdAttr = settlement.MarketId ? ` station-market-id="${settlement.MarketId}"` : '';
            const econSlug = this.mapEconomyToCategory(settlement.StationEconomy);
            const query = this.buildMapsQuery(econSlug, pads);
            const mapsHref = `#/settlement-maps${query ? `?${query}` : ''}`;
            
            return {
                StationName: `${settlement.StationName} <x-external-links station-name="${settlement.StationName}" station-system="${systemName}"${marketIdAttr}></x-external-links> <a href="${mapsHref}" title="Open Settlement Maps with filters">[Maps]</a>`,
                BodyName: settlement.BodyName || 'Unknown',
                FactionName: `${settlement.FactionName || 'Unknown'} ${settlement.FactionName ? `<x-external-links faction-name="${settlement.FactionName}"></x-external-links>` : ''}`,
                StationEconomy: settlement.StationEconomy || 'Unknown',
                StationGovernment: settlement.StationGovernment || 'Unknown',
                LandingPads: padInfo
            };
        });
        
        table.setRows(processedRows);
    }

    mapEconomyToCategory(economy) {
        const s = String(economy || '').toLowerCase().trim();
        const normalized = s.replace(/\s+/g, '');
        const map = {
            agri: 'agricultural',
            extraction: 'extraction',
            industrial: 'industrial',
            military: 'military',
            hightech: 'hightech',
            tourism: 'tourist',
        };
        return map[normalized] || '';
    }

    buildMapsQuery(econSlug, pads) {
        const params = new URLSearchParams();
        if (econSlug) params.set('economy', econSlug);
        const s = Number(pads?.Small ?? 0);
        const m = Number(pads?.Medium ?? 0);
        const l = Number(pads?.Large ?? 0);
        params.set('small', String(s));
        params.set('medium', String(m));
        params.set('large', String(l));
        return params.toString();
    }
}

export function registerSettlementsComponent() {
    customElements.define('x-settlements', SettlementsComponent);
}
