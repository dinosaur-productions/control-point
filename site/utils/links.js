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