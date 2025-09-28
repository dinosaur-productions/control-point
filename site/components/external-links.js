class ExternalLinksComponent extends HTMLElement {
    static get observedAttributes() {
        return ['system-name', 'system-address', 'station-name', 'station-system', 'station-market-id', 'faction-name'];
    }

    constructor() {
        super();
        this.innerHTML = '<span class="external-links"></span>';
        this.container = this.querySelector('.external-links');
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        if (this.container) {
            this.render();
        }
    }

    render() {
        const systemName = this.getAttribute('system-name');
        const systemAddress = this.getAttribute('system-address');
        const stationName = this.getAttribute('station-name');
        const stationSystem = this.getAttribute('station-system');
        const stationMarketId = this.getAttribute('station-market-id');
        const factionName = this.getAttribute('faction-name');

        let links = '';

        if (systemName) {
            // System links: internal (if address), Inara, Spansh (if address)
            links = this.generateSystemLinks(systemName, systemAddress);
        } else if (stationName && stationSystem) {
            // Station links: Inara, Spansh (if market ID)
            links = this.generateStationLinks(stationName, stationSystem, stationMarketId);
        } else if (factionName) {
            // Faction links: Inara only
            links = this.generateFactionLinks(factionName);
        }

        this.container.innerHTML = links;
    }

    generateSystemLinks(systemName, systemAddress) {
        const internalLink = systemAddress ? `#/system/${systemAddress}` : null;
        const inaraLink = `https://inara.cz/elite/starsystem/?search=${encodeURIComponent(systemName)}`;
        const spanshLink = systemAddress ? `https://spansh.co.uk/system/${systemAddress}` : null;
        
        return `
            ${internalLink ? `<a href="${internalLink}" title="View system details" class="link-icon internal">C</a>` : ''}
            <a href="${inaraLink}" target="_blank" title="View system on Inara" class="link-icon inara">I</a>
            ${spanshLink ? `<a href="${spanshLink}" target="_blank" title="View system on Spansh" class="link-icon spansh">S</a>` : ''}
        `;
    }

    generateStationLinks(stationName, systemName, marketId) {
        const searchString = `${stationName} [${systemName}]`;
        const inaraLink = `https://inara.cz/elite/station/?search=${encodeURIComponent(searchString)}`;
        const spanshLink = marketId ? `https://spansh.co.uk/station/${marketId}` : null;
        
        return `
            <a href="${inaraLink}" target="_blank" title="View station on Inara" class="link-icon inara">I</a>
            ${spanshLink ? `<a href="${spanshLink}" target="_blank" title="View station on Spansh" class="link-icon spansh">S</a>` : ''}
        `;
    }

    generateFactionLinks(factionName) {
        const inaraLink = `https://inara.cz/elite/minorfaction/?search=${encodeURIComponent(factionName)}`;
        
        return `
            <a href="${inaraLink}" target="_blank" title="View faction on Inara" class="link-icon inara">I</a>
        `;
    }
}

export function registerExternalLinksComponent() {
    customElements.define('x-external-links', ExternalLinksComponent);
}