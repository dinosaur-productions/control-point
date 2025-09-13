import { getDbConn } from "../index.js";

/**
 * Search for systems with names matching the given pattern
 * @param {string} searchPattern - Pattern to search for (will be used with ILIKE)
 * @returns {Promise<Array>} Array of system objects with StarSystem and SystemAddress
 */
export async function searchSystems(searchPattern) {
    const conn = await getDbConn();
    const stmt = await conn.prepare(
        `SELECT StarSystem,SystemAddress FROM systems WHERE LOWER(StarSystem) ILIKE ? LIMIT 20;`
    );
    const result = await stmt.query(`${searchPattern}%`);
    return result.toArray().map(row => row.toJSON());
}

/**
 * Get infrastructure failures with distance from origin system
 * @param {number} originSystemAddress - System address of the origin system
 * @returns {Promise<Array>} Array of infrastructure failure objects with distance
 */
export async function getInfraFailures(originSystemAddress) {
    const conn = await getDbConn();
    const stmt = await conn.prepare(
        `SELECT *, round(system__address_distance(?, SystemAddress),0) AS "Distance" FROM infra_failures;`
    );
    const result = await stmt.query(originSystemAddress.toString());
    return result.toArray().map(row => row.toJSON());
}

/**
 * Get supporting systems for a given system address
 * @param {number} systemAddress - The system address to find supporting systems for
 * @returns {Promise<Array>} Array of supporting system objects with distance
 */
export async function getSupportingSystems(systemAddress) {
    const conn = await getDbConn();
    const stmt = await conn.prepare(
        `SELECT 
            ps.SupportingSystemAddress,
            ps.Distance,
            s.StarSystem as SupportingSystemName,
            s.PowerplayState
        FROM powerplay_support ps
        JOIN systems s ON s.SystemAddress = ps.SupportingSystemAddress
        WHERE ps.SupportedSystemAddress = ?
        ORDER BY ps.Distance ASC;`
    );
    const result = await stmt.query(systemAddress.toString());
    return result.toArray().map(row => row.toJSON());
}

/**
 * Get systems supported by a given system address (reverse of getSupportingSystems)
 * @param {number} systemAddress - The system address to find supported systems for
 * @returns {Promise<Array>} Array of supported system objects with distance
 */
export async function getSupportedSystems(systemAddress) {
    const conn = await getDbConn();
    const stmt = await conn.prepare(
        `SELECT 
            ps.SupportedSystemAddress,
            ps.Distance,
            s.StarSystem as SupportedSystemName,
            s.PowerplayState
        FROM powerplay_support ps
        JOIN systems s ON s.SystemAddress = ps.SupportedSystemAddress
        WHERE ps.SupportingSystemAddress = ?
        ORDER BY ps.Distance ASC;`
    );
    const result = await stmt.query(systemAddress.toString());
    return result.toArray().map(row => row.toJSON());
}

/**
 * Get system information by system address
 * @param {number} systemAddress - The system address to look up
 * @returns {Promise<Array>} Array of system objects (should contain 0 or 1 items)
 */
export async function getSystemByAddress(systemAddress) {
    const conn = await getDbConn();
    const stmt = await conn.prepare(
        `SELECT * FROM systems WHERE SystemAddress = ?;`
    );
    const result = await stmt.query(systemAddress.toString());
    const rows = result.toArray();
    if (rows.length === 0) return null;
    return rows[0].toJSON();
}
