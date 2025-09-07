import { getSystemByAddress } from "../utils/data-access.js";
import { inaraSystemByName, spanshSystem } from "../utils/links.js";
import { getAvailableActivities, SystemInfo } from "../utils/activities.js";

class SystemActivityComponent extends HTMLElement {
    static get observedAttributes() {
        return ['system-address'];
    }

    constructor() {
        super();
        this.innerHTML = `<div class="system-activity">Loading...</div>`;
        this.container = this.querySelector('.system-activity');
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
            this.container.textContent = "No system selected.";
            return;
        }
        let numSystemAddress = Number(systemAddress);
        this.container.textContent = "Loading system data...";
        try {
            const row = await getSystemByAddress(numSystemAddress);
            if (row === null) {
                this.container.textContent = "System not found.";
                return;
            }

            // Format the last update time
            const lastUpdateDate = new Date(row.LastUpdate);
            const timeAgo = this.getTimeAgo(row.LastUpdate);

            // Format control progress as a percentage
            const controlProgress = row.PowerplayStateControlProgress
                ? `${Math.floor(row.PowerplayStateControlProgress * 100)}%`
                : null;

            // Check if Powers array is empty
            const powers = row.Powers && typeof row.Powers.toArray === 'function' ? row.Powers.toArray() : [];
            const powersLine = powers.length > 0 ? `<p>In range of: ${powers.join(', ')}</p>` : 'Not in range of any power';

            // Generate external links for the system
            const systemInaraLink = inaraSystemByName(row.StarSystem);
            const systemSpanshLink = spanshSystem(numSystemAddress);

            // Build the new layout
            this.container.innerHTML = `
                <div class="system-info">
                    <!-- Header with system name and last update -->
                    <div class="system-header">
                        <div class="system-name">
                            <h1>${row.StarSystem}</h1>
                            <span class="external-links">
                                <a href="${systemInaraLink}" target="_blank" title="View system on Inara" class="link-icon inara">I</a>
                                <a href="${systemSpanshLink}" target="_blank" title="View system on Spansh" class="link-icon spansh">S</a>
                            </span>
                        </div>
                        <div class="last-update">
                            <small>Updated ${timeAgo}</small>
                            <small>${lastUpdateDate.toLocaleString(undefined, {dateStyle: "short", timeStyle:"short"})}</small>
                        </div>
                    </div>

                    ${powersLine ? `<div class="powers-info">${powersLine}</div>` : ''}

                    <!-- Powerplay Banner -->
                    ${this.renderPowerplayBanner(row, controlProgress)}

                    <!-- Activity Section with Category Navigation -->
                    ${this.renderActivitySection(row)}

                    <!-- Available Activities -->
                    ${this.renderActivitiesSection(row)}
                </div>
            `;

            // Add event listeners for category navigation
            this.setupCategoryNavigation();
        } catch (err) {
            this.container.textContent = "Unexpected error.";
            console.error(err);
        }
    }

    renderPowerplayBanner(row, controlProgress) {
        // Handle independent/unoccupied systems
        if (row.PowerplayState === 'Unoccupied') {
            // Check if there are powers gathering control points
            if (row.PowerplayConflictProgress && typeof row.PowerplayConflictProgress.toArray === 'function') {
                const conflicts = row.PowerplayConflictProgress.toArray();
                if (conflicts.length > 0) {
                    return this.renderUnoccupiedSystemBanner(conflicts);
                }
            }
            return '';
        }

        // Handle occupied systems
        const progressValue = controlProgress ? parseFloat(row.PowerplayStateControlProgress) : 0;
        
        let bannerContent = `
            <div class="powerplay-banner">
                <div class="banner-content">
                    <div class="power-info">
                        <span class="power-name">${row.ControllingPower}</span>
                        <span class="state-name">${row.PowerplayState || 'Unknown'}</span>
                    </div>
                    ${this.renderTugOfWar(row)}
                    ${this.renderFourStateProgressBar(row, progressValue)}
                </div>
            </div>
        `;

        return bannerContent;
    }

    renderTugOfWar(row) {
        const undermining = row.PowerplayStateUndermining || 0;
        const reinforcement = row.PowerplayStateReinforcement || 0;
        
        return `
            <div class="tug-of-war">
                <div class="undermining-side">
                    <span class="tug-label">Undermining</span>
                    <span class="tug-value undermining-value">${undermining.toLocaleString()}</span>
                </div>
                <div class="reinforcement-side">
                    <span class="tug-label">Reinforcement</span>
                    <span class="tug-value reinforcement-value">${reinforcement.toLocaleString()}</span>
                </div>
            </div>
        `;
    }

    renderFourStateProgressBar(row, progressValue) {
        // Define the four states
        const states = ['Unoccupied', 'Exploited', 'Fortified', 'Stronghold'];
        const stateColors = ['#666', '#e74c3c', '#27ae60', '#9b59b6'];
        
        // Find current state index
        let currentStateIndex = 0;
        if (row.PowerplayState) {
            currentStateIndex = states.indexOf(row.PowerplayState);
            if (currentStateIndex === -1) currentStateIndex = 1; // Default to Exploited if unknown
        }
        
        // Calculate indicator position (0-4 scale, where each state takes 1 unit)
        let indicatorPosition = currentStateIndex + progressValue;
        
        // Clamp between 0 and 4 (though it can go slightly outside for visual effect)
        const clampedPosition = Math.max(0, Math.min(4, indicatorPosition));
        const positionPercent = (clampedPosition / 4) * 100;
        
        // Format progress value for display
        const progressPercent = (progressValue * 100).toFixed(1);
        
        return `
            <div class="four-state-progress">
                <div class="state-bar">
                    ${states.map((state, index) => `
                        <div class="state-segment ${state.toLowerCase()}" style="background-color: ${stateColors[index]}">
                            <span class="state-label">${state}</span>
                        </div>
                    `).join('')}
                    <div class="state-indicator" style="left: ${positionPercent}%">
                        <div class="progress-label">${progressPercent}%</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderUnoccupiedSystemBanner(conflicts) {
        // Sort conflicts by progress (highest first)
        const sortedConflicts = conflicts.sort((a, b) => b.ConflictProgress - a.ConflictProgress);
        
        // Calculate dynamic maxDisplay based on highest score
        const maxPoints = Math.max(...sortedConflicts.map(conflict => Math.floor(conflict.ConflictProgress * 120000)));
        const controlThreshold = 120000;
        const maxDisplay = Math.max(150000, maxPoints + 20000); // At least 150K or highest score + 20K
        
        let bannerContent = `
            <div class="powerplay-banner unoccupied">
                <div class="banner-content">
                    <div class="power-info">
                        <span class="power-name">Unoccupied</span>
                    </div>
                    <div class="conflict-bars">
        `;

        sortedConflicts.forEach(conflict => {
            const points = Math.floor(conflict.ConflictProgress * 120000);
            const conflictThreshold = 36000;
            
            // Calculate percentages for display (0-100% of maxDisplay)
            const conflictPercent = (conflictThreshold / maxDisplay) * 100;
            const controlPercent = (controlThreshold / maxDisplay) * 100;
            const currentPercent = Math.min((points / maxDisplay) * 100, 100);

            bannerContent += `
                <div class="power-conflict-bar">
                    <div class="power-conflict-header">
                        <span class="conflict-power-name">${conflict.Power}</span>
                        <span class="conflict-points">${points.toLocaleString()} pts</span>
                    </div>
                    <div class="multi-threshold-bar">
                        <div class="threshold-bar-bg">
                            <div class="threshold-marker conflict-marker" style="left: ${conflictPercent}%">
                                <div class="threshold-label">Conflict<br>${conflictThreshold.toLocaleString()}</div>
                            </div>
                            <div class="threshold-marker control-marker" style="left: ${controlPercent}%">
                                <div class="threshold-label">Control<br>${controlThreshold.toLocaleString()}</div>
                            </div>
                            <div class="progress-fill-multi" style="width: ${currentPercent}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });

        bannerContent += `
                    </div>
                </div>
            </div>
        `;

        return bannerContent;
    }

    renderActivitySection(row) {
        // Create SystemInfo for the system to get available categories
        const systemInfo = new SystemInfo({
            controllingPower: row.ControllingPower || '',
            inConflict: row.PowerplayConflictProgress && 
                        typeof row.PowerplayConflictProgress.toArray === 'function' && 
                        row.PowerplayConflictProgress.toArray().length > 0
        });

        const action = row.Activity;
        const activities = getAvailableActivities(row.StarSystem, action, systemInfo);

        // Group activities by category to get available categories
        const groupedActivities = {};
        activities.forEach(activity => {
            const category = activity.category || 'Misc';
            if (!groupedActivities[category]) {
                groupedActivities[category] = [];
            }
            groupedActivities[category].push(activity);
        });

        // Get available categories in the specified order
        const categoryOrder = ['Hauling', 'Mining', 'Space Combat', 'On Foot', 'Misc'];
        const availableCategories = categoryOrder.filter(category => groupedActivities[category]);

        return `
            <div class="activity-section">
                <div class="activities-header">
                    <h3>${action}</h3>
                    <div class="category-nav">
                        ${availableCategories.map(category => 
                            `<button type="button" class="category-link" data-category="${category.toLowerCase().replace(/\s+/g, '-')}">${category}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderActivitiesSection(row) {
        // Create SystemInfo for the system
        const systemInfo = new SystemInfo({
            controllingPower: row.ControllingPower || '',
            inConflict: row.PowerplayConflictProgress && 
                        typeof row.PowerplayConflictProgress.toArray === 'function' && 
                        row.PowerplayConflictProgress.toArray().length > 0
        });

        // Use the system's specific activity
        const action = row.Activity;
        
        // Get activities for this specific action
        const activities = getAvailableActivities(row.StarSystem, action, systemInfo);
        
        if (activities.length === 0) {
            return `
                <div class="activities-section">
                    <p class="no-activities">No activities available for ${action} in this system.</p>
                </div>
            `;
        }

        // Group activities by category
        const groupedActivities = {};
        activities.forEach(activity => {
            const category = activity.category || 'Misc';
            if (!groupedActivities[category]) {
                groupedActivities[category] = [];
            }
            groupedActivities[category].push(activity);
        });

        // Get available categories in the specified order
        const categoryOrder = ['Hauling', 'Mining', 'Space Combat', 'On Foot', 'Misc'];
        const availableCategories = categoryOrder.filter(category => groupedActivities[category]);

        let activitiesHTML = `
            <div class="activities-section">
                <div class="activities-list">
        `;

        // Render each category
        availableCategories.forEach(category => {
            activitiesHTML += `
                <div class="category-section" id="category-${category.toLowerCase().replace(/\s+/g, '-')}">
                    <h4 class="category-title">${category}</h4>
                    <div class="category-activities">
            `;

            groupedActivities[category].forEach(activity => {
                const legalBadge = activity.legal ? 
                    '<span class="legal-badge legal">Legal</span>' : 
                    '<span class="legal-badge illegal">Illegal</span>';

                activitiesHTML += `
                    <div class="activity-item">
                        <div class="activity-header">
                            <span class="activity-name">${activity.activity}</span>
                            ${legalBadge}
                        </div>
                        <div class="activity-details">
                            <div class="activity-detail">
                                ${activity.details}
                            </div>
                            <div class="activity-detail pickup-handin">
                                Pick up ${activity.pickup}${activity.handIn ? `, Hand in ${activity.handIn}` : ''}
                            </div>
                            ${activity.notes ? `
                                <div class="activity-detail">
                                    <strong>Notes:</strong> ${activity.notes}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            activitiesHTML += `
                    </div>
                </div>
            `;
        });

        activitiesHTML += `
                </div>
            </div>
        `;

        return activitiesHTML;
    }

    setupCategoryNavigation() {
        const categoryLinks = this.container.querySelectorAll('.category-link');
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const categoryId = e.target.getAttribute('data-category');
                const targetElement = this.container.querySelector(`#category-${categoryId}`);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    }
}

export function registerSystemActivityComponent() {
    customElements.define('x-system-activity', SystemActivityComponent);
}