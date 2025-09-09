/**
 * Functions to generate links to external Elite Dangerous tools and databases
 */

/**
 * Generate a link to Inara for a star system by name
 * @param {string} systemName - The name of the star system
 * @returns {string} URL to the Inara star system page
 */
export function inaraSystemByName(systemName) {
    const encoded = encodeURIComponent(systemName);
    return `https://inara.cz/elite/starsystem/?search=${encoded}`;
}

/**
 * Generate a link to Inara for a star system by address
 * @param {number|string} systemAddress - The system address
 * @returns {string} URL to the Inara star system page
 */
export function inaraSystemByAddress(systemAddress) {
    const encoded = encodeURIComponent(systemAddress.toString());
    return `https://inara.cz/elite/starsystem/?search=${encoded}`;
}

/**
 * Generate a link to Inara for a station
 * @param {string} stationName - The name of the station
 * @param {string} systemName - The name of the star system where the station is located
 * @returns {string} URL to the Inara station page
 */
export function inaraStation(stationName, systemName) {
    const searchString = `${stationName} [${systemName}]`;
    const encoded = encodeURIComponent(searchString);
    return `https://inara.cz/elite/station/?search=${encoded}`;
}

/**
 * Generate a link to Inara for a fleet carrier by callsign
 * @param {string} callsign - The fleet carrier callsign
 * @returns {string} URL to the Inara station page (fleet carriers are treated as stations)
 */
export function inaraFleetCarrier(callsign) {
    const encoded = encodeURIComponent(callsign);
    return `https://inara.cz/elite/station/?search=${encoded}`;
}

/**
 * Generate a link to Inara for a minor faction
 * @param {string} factionName - The name of the minor faction
 * @returns {string} URL to the Inara minor faction page
 */
export function inaraMinorFaction(factionName) {
    const encoded = encodeURIComponent(factionName);
    return `https://inara.cz/elite/minorfaction/?search=${encoded}`;
}

/**
 * Generate a link to Spansh for a star system by system ID
 * @param {number|string} systemId - The system ID (typically SystemAddress)
 * @returns {string} URL to the Spansh system page
 */
export function spanshSystem(systemId) {
    return `https://spansh.co.uk/system/${systemId}`;
}

/**
 * Generate a link to Spansh for a station by market ID
 * @param {number|string} marketId - The market ID of the station
 * @returns {string} URL to the Spansh station page
 */
export function spanshStation(marketId) {
    return `https://spansh.co.uk/station/${marketId}`;
}

/**
 * Generate a link to Spansh for a celestial body by body ID
 * @param {number|string} bodyId - The body ID
 * @returns {string} URL to the Spansh body page
 */
export function spanshBody(bodyId) {
    return `https://spansh.co.uk/body/${bodyId}`;
}

/**
 * Generate an internal link to the system-activity page for a system
 * @param {number|string} systemAddress - The system address
 * @returns {string} Internal URL to the system-activity page
 */
export function internalSystemLink(systemAddress) {
    return `#/system/${systemAddress}`;
}

/**
 * Process text to convert "supporting system" mentions into internal links
 * @param {string} text - The text to process
 * @returns {string} Text with "supporting system" converted to clickable links
 */
export function linkifySupportingSystems(text) {
    if (!text) return text;
    
    // Replace "supporting system" with a clickable link that scrolls to the Supporting Systems section
    return text.replace(
        /supporting system/gi,
        '<a href="#" onclick="document.getElementById(\'supporting-systems-details\')?.scrollIntoView({behavior: \'smooth\'}); document.getElementById(\'supporting-systems-details\')?.setAttribute(\'open\', \'true\'); return false;" class="internal-link">supporting system</a>'
    );
}

/**
 * Generate external links HTML for a system
 * @param {Object} systemData - System data object
 * @param {string} systemData.name - The system name
 * @param {number|string} systemData.address - The system address
 * @returns {string} HTML string with external links
 */
export function generateSystemLinks(systemData) {
    if (!systemData || !systemData.name) return '';
    
    const internalLink = systemData.address ? internalSystemLink(systemData.address) : null;
    const inaraLink = inaraSystemByName(systemData.name);
    const spanshLink = systemData.address ? spanshSystem(systemData.address) : null;
    
    return `
        <span class="external-links">
            ${internalLink ? `<a href="${internalLink}" title="View system details" class="link-icon internal">c</a>` : ''}
            <a href="${inaraLink}" target="_blank" title="View system on Inara" class="link-icon inara">I</a>
            ${spanshLink ? `<a href="${spanshLink}" target="_blank" title="View system on Spansh" class="link-icon spansh">S</a>` : ''}
        </span>
    `;
}

/**
 * Generate external links HTML for a station
 * @param {Object} stationData - Station data object
 * @param {string} stationData.name - The station name
 * @param {string} stationData.systemName - The system name where the station is located
 * @param {number|string} [stationData.marketId] - The market ID of the station
 * @returns {string} HTML string with external links
 */
export function generateStationLinks(stationData) {
    if (!stationData || !stationData.name || !stationData.systemName) return '';
    
    const inaraLink = inaraStation(stationData.name, stationData.systemName);
    const spanshLink = stationData.marketId ? spanshStation(stationData.marketId) : null;
    
    return `
        <span class="external-links">
            <a href="${inaraLink}" target="_blank" title="View station on Inara" class="link-icon inara">I</a>
            ${spanshLink ? `<a href="${spanshLink}" target="_blank" title="View station on Spansh" class="link-icon spansh">S</a>` : ''}
        </span>
    `;
}

/**
 * Generate external links HTML for a faction
 * @param {Object} factionData - Faction data object
 * @param {string} factionData.name - The faction name
 * @returns {string} HTML string with external links
 */
export function generateFactionLinks(factionData) {
    if (!factionData || !factionData.name) return '';
    
    const inaraLink = inaraMinorFaction(factionData.name);
    
    return `
        <span class="external-links">
            <a href="${inaraLink}" target="_blank" title="View faction on Inara" class="link-icon inara">I</a>
        </span>
    `;
}

/**
 * Generate all external links for a complete entity (system, station, faction)
 * @param {Object} entityData - Entity data object
 * @param {Object} [entityData.system] - System data with name and address
 * @param {Object} [entityData.station] - Station data with name, systemName, and marketId
 * @param {Object} [entityData.faction] - Faction data with name
 * @returns {Object} Object containing formatted HTML links for each entity type
 */
export function generateAllLinks(entityData) {
    const links = {};
    
    if (entityData.system) {
        links.system = generateSystemLinks(entityData.system);
    }
    
    if (entityData.station) {
        links.station = generateStationLinks(entityData.station);
    }
    
    if (entityData.faction) {
        links.faction = generateFactionLinks(entityData.faction);
    }
    
    return links;
}
