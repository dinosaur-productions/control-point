import { getSystemByAddress, getSupportingSystems, getSupportedSystems } from "../utils/data-access.js";

import { getAvailableActivities, SystemInfo, ACTIVITIES } from "../utils/activities.js";
import { CONFLICT_THRESHOLD, ACQUISITION_THRESHOLD, EXPLOITED_THRESHOLD, FORTIFIED_THRESHOLD, STRONGHOLD_THRESHOLD } from "../utils/constants.js";

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

            // Format control progress as a percentage
            const controlProgress = row.PowerplayStateControlProgress
                ? `${Math.floor(row.PowerplayStateControlProgress * 100)}%`
                : null;

            // Check if Powers array is empty
            const powers = row.Powers && typeof row.Powers.toArray === 'function' ? row.Powers.toArray() : [];
            const powersLine = powers.length > 0 ? `<p>In range of: ${powers.join(', ')}</p>` : 'Not in range of any power';

            // Generate external links for the system
            const systemLinks = `<x-external-links system-name="${row.StarSystem}" system-address="${numSystemAddress}"></x-external-links>`;

            // Build the new layout
            this.container.innerHTML = `
                <div class="system-info">
                    <!-- Header with system name and last update -->
                    <div class="system-header">
                        <div class="system-name">
                            <h1>${row.StarSystem}</h1>
                            ${systemLinks}
                        </div>
                        <x-last-updated timestamp="${lastUpdateDate.toISOString()}" stale-threshold="24"></x-last-updated>
                    </div>

                    ${powersLine ? `<div class="powers-info">${powersLine}</div>` : ''}

                    <!-- Powerplay Banner -->
                    ${this.renderPowerplayBanner(row, controlProgress)}

                    <!-- Supporting Systems -->
                    ${await this.renderSupportingSystems(row)}

                    <!-- Supported Systems -->
                    ${await this.renderSupportedSystems(row)}

                    <!-- Activity Section with Category Navigation -->
                    ${this.renderActivitySection(row)}

                    <!-- Available Activities -->
                    ${this.renderActivitiesSection(row)}
                </div>
            `;

            // Add event listeners for category navigation
            this.setupCategoryNavigation();
            
            // Populate supporting systems table if it exists
            await this.populateSupportingSystemsTable(row);
            
            // Populate supported systems table if it exists
            await this.populateSupportedSystemsTable(row);
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
        
        // Modify powerplay state display for stronghold carriers
        let displayState = row.PowerplayState || 'Unknown';
        if (row.PowerplayState === 'Stronghold' && row.PowerplayHasStrongholdCarrier) {
            displayState = 'Stronghold + Carrier';
        }
        
        let bannerContent = `
            <div class="powerplay-banner">
                <div class="banner-content">
                    <div class="power-info">
                        <span class="power-name">${row.ControllingPower}</span>
                        <span class="state-name">${displayState}</span>
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
        const difference = reinforcement - undermining;
        
        // Calculate current control points based on state
        const progressValue = row.PowerplayStateControlProgress || 0;
        let stateThreshold = EXPLOITED_THRESHOLD; // Default
        if (row.PowerplayState === 'Fortified') {
            stateThreshold = FORTIFIED_THRESHOLD;
        } else if (row.PowerplayState === 'Stronghold') {
            stateThreshold = STRONGHOLD_THRESHOLD;
        }
        const currentControlPoints = Math.floor(progressValue * stateThreshold);
        
        return `
            <div class="tug-of-war">
                <div class="undermining-side">
                    <span class="tug-label">Undermining</span>
                    <span class="tug-value undermining-value">${undermining.toLocaleString()}</span>
                </div>
                <div class="tug-of-war-center">
                    <div class="tug-stat">
                        <span class="tug-label">${difference >= 0 ? 'Net Reinforcing' : 'Net Undermining'}</span>
                        <span class="tug-value ${difference >= 0 ? 'positive' : 'negative'}">${difference >= 0 ? '+' : ''}${difference.toLocaleString()}</span>
                    </div>
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
        
        // Calculate current control points based on state
        let stateThreshold = EXPLOITED_THRESHOLD; // Default
        if (row.PowerplayState === 'Fortified') {
            stateThreshold = FORTIFIED_THRESHOLD;
        } else if (row.PowerplayState === 'Stronghold') {
            stateThreshold = STRONGHOLD_THRESHOLD;
        }
        const currentControlPoints = Math.floor(progressValue * stateThreshold);
        
        return `
            <div class="four-state-progress">
                <div class="state-bar">
                    ${states.map((state, index) => `
                        <div class="state-segment ${state.toLowerCase()}" style="background-color: ${stateColors[index]}">
                            <span class="state-label">${state}</span>
                        </div>
                    `).join('')}
                    <div class="state-indicator" style="left: ${positionPercent}%">
                        <div class="progress-label">${progressPercent}% ~ ${currentControlPoints.toLocaleString()} CP</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderUnoccupiedSystemBanner(conflicts) {
        // Sort conflicts by progress (highest first)
        const sortedConflicts = conflicts.sort((a, b) => b.ConflictProgress - a.ConflictProgress);
        
        // Calculate dynamic maxDisplay based on highest score
        const maxPoints = Math.max(...sortedConflicts.map(conflict => Math.floor(conflict.ConflictProgress * ACQUISITION_THRESHOLD)));
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
            const points = Math.floor(conflict.ConflictProgress * ACQUISITION_THRESHOLD);
            
            // Calculate percentages for display (0-100% of maxDisplay)
            const conflictPercent = (CONFLICT_THRESHOLD / maxDisplay) * 100;
            const controlPercent = (ACQUISITION_THRESHOLD / maxDisplay) * 100;
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
        const action = this.calculateAction(row);
        
        // Create SystemInfo for the system to get available categories
        const systemInfo = new SystemInfo({
            controllingPower: row.ControllingPower || '',
            inConflict: row.PowerplayConflictProgress && 
                        typeof row.PowerplayConflictProgress.toArray === 'function' && 
                        row.PowerplayConflictProgress.toArray().length > 0
        });

        let activities = getAvailableActivities(row.StarSystem, action, systemInfo);
        
        // Filter activities for stronghold carrier undermining
        if (action === 'Undermine' && row.PowerplayHasStrongholdCarrier) {
            activities = activities.filter(activity => activity.strongholdCarrierUndermining === true);
        }

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
        const categoryOrder = ['Hauling', 'Mining', 'Combat', 'On Foot', 'Misc'];
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

    async renderSupportingSystems(row) {
        // Only show supporting systems for systems that can be acquired (Unoccupied + Li Yong-Rui in range)
        // or systems that are Exploited by Li Yong-Rui
        const shouldShowSupport = (
            row.PowerplayState === 'Unoccupied' && 
            row.Powers && typeof row.Powers.toArray === 'function' && 
            row.Powers.toArray().includes('Li Yong-Rui')) ||
            (row.PowerplayState === 'Exploited' && row.ControllingPower === 'Li Yong-Rui');

        if (!shouldShowSupport) {
            return '';
        }

        try {
            const supportingSystems = await getSupportingSystems(row.SystemAddress);
            
            if (supportingSystems.length === 0) {
                return '';
            }

            return `
                <div class="supporting-systems-section">
                    <details class="supporting-systems-details" id="supporting-systems-details">
                        <summary class="supporting-systems-header">
                            <span>Supporting Systems (${supportingSystems.length})</span>
                        </summary>
                        <div class="supporting-systems-content">
                            <x-sortable-table id="supporting-systems-table"></x-sortable-table>
                        </div>
                    </details>
                </div>
            `;
        } catch (error) {
            console.error('Error loading supporting systems:', error);
            return '';
        }
    }

    async populateSupportingSystemsTable(row) {
        // Check if we should show supporting systems (same logic as renderSupportingSystems)
        const shouldShowSupport = (
            row.PowerplayState === 'Unoccupied' && 
            row.Powers && typeof row.Powers.toArray === 'function' && 
            row.Powers.toArray().includes('Li Yong-Rui')) ||
            (row.PowerplayState === 'Exploited' && row.ControllingPower === 'Li Yong-Rui');

        if (!shouldShowSupport) return;

        // Wait a bit for the custom element to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const table = this.querySelector('#supporting-systems-table');
        if (!table) {
            console.warn('Supporting systems table not found');
            return;
        }

        try {
            const supportingSystems = await getSupportingSystems(row.SystemAddress);
            
            if (supportingSystems.length === 0) return;

            // Set up table headers
            table.setHeaders([
                { key: 'System', label: 'System', sortable: true },
                { key: 'PowerplayState', label: 'Powerplay Status', sortable: true },
                { key: 'Distance', label: 'Distance', sortable: true }
            ]);

            // Process and add rows to the table
            const processedRows = supportingSystems.map(system => {
                const systemCell = `${system.SupportingSystemName} <x-external-links system-name="${system.SupportingSystemName}" system-address="${system.SupportingSystemAddress}"></x-external-links>`;
                const statusCell = system.PowerplayState;
                const distanceCell = `${Math.round(system.Distance)} LY`;
                
                return {
                    System: systemCell,
                    PowerplayState: statusCell,
                    Distance: distanceCell
                };
            });
            
            table.setRows(processedRows);
        } catch (error) {
            console.error('Error populating supporting systems table:', error);
        }
    }

    async renderSupportedSystems(row) {
        // Only show supported systems for Li Yong-Rui Fortified or Stronghold systems
        const shouldShowSupported = row.ControllingPower === 'Li Yong-Rui' && 
                                    (row.PowerplayState === 'Fortified' || row.PowerplayState === 'Stronghold');

        if (!shouldShowSupported) {
            return '';
        }

        try {
            const supportedSystems = await getSupportedSystems(row.SystemAddress);
            
            if (supportedSystems.length === 0) {
                return '';
            }

            return `
                <div class="supported-systems-section">
                    <details class="supported-systems-details" id="supported-systems-details">
                        <summary class="supported-systems-header">
                            <span>Supported Systems (${supportedSystems.length})</span>
                        </summary>
                        <div class="supported-systems-content">
                            <x-sortable-table id="supported-systems-table"></x-sortable-table>
                        </div>
                    </details>
                </div>
            `;
        } catch (error) {
            console.error('Error loading supported systems:', error);
            return '';
        }
    }

    async populateSupportedSystemsTable(row) {
        // Check if we should show supported systems (same logic as renderSupportedSystems)
        const shouldShowSupported = row.ControllingPower === 'Li Yong-Rui' && 
                                    (row.PowerplayState === 'Fortified' || row.PowerplayState === 'Stronghold');

        if (!shouldShowSupported) return;

        // Wait a bit for the custom element to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const table = this.querySelector('#supported-systems-table');
        if (!table) {
            console.warn('Supported systems table not found');
            return;
        }

        try {
            const supportedSystems = await getSupportedSystems(row.SystemAddress);
            
            if (supportedSystems.length === 0) return;

            // Set up table headers
            table.setHeaders([
                { key: 'System', label: 'System', sortable: true },
                { key: 'PowerplayState', label: 'Powerplay Status', sortable: true },
                { key: 'Distance', label: 'Distance', sortable: true }
            ]);

            // Process and add rows to the table
            const processedRows = supportedSystems.map(system => {
                const systemCell = `${system.SupportedSystemName} <x-external-links system-name="${system.SupportedSystemName}" system-address="${system.SupportedSystemAddress}"></x-external-links>`;
                const statusCell = system.PowerplayState;
                const distanceCell = `${Math.round(system.Distance)} LY`;
                
                return {
                    System: systemCell,
                    PowerplayState: statusCell,
                    Distance: distanceCell
                };
            });
            
            table.setRows(processedRows);
        } catch (error) {
            console.error('Error populating supported systems table:', error);
        }
    }
    calculateAction(row) {
        const controllingPower = row.ControllingPower || null;
        const powerplayState = row.PowerplayState || 'Unoccupied';
        const powers = row.Powers && typeof row.Powers.toArray === 'function' ? row.Powers.toArray() : [];
        const isLYRInRange = powers.includes('Li Yong-Rui');
        
        if (controllingPower === 'Li Yong-Rui') {
            return 'Reinforce';
        } else if (powerplayState === 'Unoccupied' && isLYRInRange) {
            return 'Acquire';
        } else if (powerplayState === 'Unoccupied') {
            return 'Out of Range';
        } else {
            return 'Undermine';
        }
    }
    renderActivitiesSection(row) {
        const action = this.calculateAction(row);
        const controllingPower = row.ControllingPower || null;
        
        // Create SystemInfo for the system
        const systemInfo = new SystemInfo({
            controllingPower: row.ControllingPower || '',
            inConflict: row.PowerplayConflictProgress && 
                        typeof row.PowerplayConflictProgress.toArray === 'function' && 
                        row.PowerplayConflictProgress.toArray().length > 0
        });
        
        // Get activities for this specific action
        let availableActivities = getAvailableActivities(row.StarSystem, action, systemInfo);
        
        // Determine which activities should be marked
        const isUnoccupied = !controllingPower;
        const isLYR = controllingPower === 'Li Yong-Rui';
        const isOtherPower = controllingPower && !isLYR;
        
        // Create a map to look up full activity definitions
        const activityMap = new Map();
        ACTIVITIES.forEach(act => {
            activityMap.set(act.activity, act);
        });
        
        // Filter activities for stronghold carrier undermining
        if (action === 'Undermine' && row.PowerplayHasStrongholdCarrier) {
            availableActivities = availableActivities.filter(activity => activity.strongholdCarrierUndermining === true);
        }
        
        if (availableActivities.length === 0) {
            return `
                <div class="activities-section">
                    <p class="no-activities">No activities available for ${action} in this system.</p>
                </div>
            `;
        }

        // Group activities by category
        const groupedActivities = {};
        availableActivities.forEach(activity => {
            const category = activity.category || 'Misc';
            if (!groupedActivities[category]) {
                groupedActivities[category] = [];
            }
            groupedActivities[category].push(activity);
        });

        // Get available categories in the specified order
        const categoryOrder = ['Hauling', 'Mining', 'Combat', 'On Foot', 'Misc'];
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
                // Get full activity definition
                const fullActivity = activityMap.get(activity.activity);
                let hasLYRBonus = false;
                let isVulnerable = false;
                
                if (fullActivity) {
                    // Check for LYR bonuses based on system state
                    if (isUnoccupied && action === 'Acquire') {
                        hasLYRBonus = fullActivity.bonusPowers?.acquisition?.includes('Li Yong-Rui') || false;
                    } else if (isLYR && action === 'Reinforce') {
                        hasLYRBonus = fullActivity.bonusPowers?.reinforcement?.includes('Li Yong-Rui') || false;
                    } else if (isOtherPower && action === 'Undermine') {
                        hasLYRBonus = fullActivity.bonusPowers?.undermining?.includes('Li Yong-Rui') || false;
                    }
                    
                    // Check if occupying power is vulnerable (separate from bonus check)
                    if (isOtherPower && action === 'Undermine') {
                        isVulnerable = fullActivity.vulnerablePowers?.includes(controllingPower) || false;
                    }
                }
                
                activitiesHTML += `
                    <x-activity-item 
                        activity-name="${activity.activity}"
                        legal="${activity.legal}"
                        details="${activity.details || ''}"
                        location="${activity.location || ''}"
                        ${activity.notes ? `notes="${activity.notes}"` : ''}
                        ${hasLYRBonus ? 'lyr-bonus="true"' : ''}
                        ${isVulnerable ? 'vulnerable="true"' : ''}
                        scroll-target="supporting-systems-details">
                    </x-activity-item>
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


}

export function registerSystemActivityComponent() {
    customElements.define('x-system-activity', SystemActivityComponent);
}