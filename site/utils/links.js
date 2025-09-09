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
