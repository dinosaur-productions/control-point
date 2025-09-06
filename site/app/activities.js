/**
 * Class to provide system information needed to determine activity availability
 */
export class SystemInfo {
    constructor(systemName) {
        this.systemName = systemName;
    }

    /**
     * Check if the system is in conflict
     * @returns {boolean}
     */
    isInConflict() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    /**
     * Check if the system has stations
     * @returns {boolean}
     */
    hasStations() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    /**
     * Check if the system has anarchy stations
     * @returns {boolean}
     */
    hasAnarchyStations() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    /**
     * Check if the system has orbital starports
     * @returns {boolean}
     */
    hasOrbitalStarports() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    /**
     * Check if the system has Odyssey settlements
     * @returns {boolean}
     */
    hasOdysseySettlements() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    /**
     * Check if the system has power contacts
     * @returns {boolean}
     */
    hasPowerContacts() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    hasPowerContactsInNonAnarchyStations() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    /**
     * Check if the system has non-dockable megaships
     * @returns {boolean}
     */
    hasNonDockableMegaships() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    /**
     * Check if the system has mining sites
     * @returns {boolean}
     */
    hasMiningSites() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    /**
     * Check if the system is a supporting system for acquisition
     * @returns {boolean}
     */
    isSupportingSystem() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    /**
     * Check if the system is a stronghold system
     * @returns {boolean}
     */
    isStrongholdSystem() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    /**
     * Check if rare goods are legal in this system
     * @returns {boolean}
     */
    areRareGoodsLegal() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    /**
     * Get the system's distance from the current location
     * @returns {number}
     */
    getDistanceFromCurrentLocation() {
        // Implementation needed
        throw new Error('Method not implemented');
    }

    controllingPower() {
        // Implementation needed
        throw new Error('Method not implemented');
    }
}

const ACTIVITIES = [
    {
        activity: "Bounty Hunting",
        acquisition: true,
        reinforcement: true,
        undermining: true, //"Only versus Delaine", see requirements
        legal: true,
        details: "Merit proportional to bounty claim, awarded on kill",
        pickup: "In Target System",
        handIn: "n/a",
        notes: "Cashing in the bounties at a friendly system power contact afterwards gives a bonus",
        bgsEffect: "Positive, generally for system controller",
        requirements: (systemInfo, action) => 
            action != 'undermining' || systemInfo.controllingPower() === 'Archon Delaine'
    },
    {
        activity: "Commit Crimes",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: false,
        details: "Murder of Power or minor faction ships or personnel",
        pickup: "In Target System",
        handIn: "n/a",
        notes: "System authority appear not to count",
        bgsEffect: "Negative for ship owner (irrelevant for Power ships)",
        requirements: (systemInfo, action) => true // Always available
    },
    {
        activity: "Complete Restore/Reactivate Missions",
        acquisition: true,
        reinforcement: true,
        undermining: false,
        legal: true,
        details: "Any Odyssey mission in the Support category",
        pickup: "Station in target system",
        handIn: "via Odyssey base in target system",
        notes: "Static merit value regardless of reward choice.",
        bgsEffect: "Positive for mission faction",
        requirements: (systemInfo, action) => systemInfo.hasStations() && systemInfo.hasOdysseySettlements()
    },
    {
        activity: "Complete Support Missions",
        acquisition: true, //"Conflict only",
        reinforcement: true,
        undermining: true,
        legal: true,
        details: "Any ship mission in the Support category",
        pickup: "Station in target system",
        handIn: "n/a",
        notes: "Merit gain proportional to donation size for those missions, with cargo donations much more effective.",
        bgsEffect: "Positive for mission faction",
        requirements: (systemInfo, action) => {
            if (action === 'acquisition') return systemInfo.hasStations() && systemInfo.isInConflict();
            return systemInfo.hasStations();
        }
    },
    {
        activity: "Collect Salvage (R)",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        details: "Black boxes, Personal Effects, Wreckage Components",
        pickup: "In Target System",
        handIn: "Power Contact in Target System",
        notes: "Unavailable at Anarchy stations.",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => systemInfo.hasPowerContactsInNonAnarchyStations() 
    },
    {
        activity: "Collect Salvage (U)",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: true,
        details: "Black boxes, Personal Effects, Wreckage Components",
        pickup: "In Target System",
        handIn: "Friendly System Power Contact",
        notes: "Unavailable at Anarchy stations.",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => systemInfo.hasPowerContacts() && !systemInfo.hasAnarchyStations()
    },
    {
        activity: "Exobiology",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        details: "",
        pickup: "Anywhere",
        handIn: "Station in target system",
        notes: "Data collected after 7 Nov 3310 only",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasStations()
    },
    {
        activity: "Exploration Data",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        details: "Merits per system, not per page - cheap systems get nothing",
        pickup: "Anywhere >20LY",
        handIn: "Station in target system",
        notes: "Data collected after 7 Nov 3310 only",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => systemInfo.hasStations() && systemInfo.getDistanceFromCurrentLocation() > 20
    },
    {
        activity: "Flood markets with low value goods (A)",
        acquisition: "Conflict only",
        reinforcement: false,
        undermining: false,
        legal: true,
        details: "Goods must sell for 500 cr or less, and be on the station market as supply or demand",
        pickup: "Station in Supporting system",
        handIn: "Station in target system",
        notes: "The cheaper the better. Hydrogen Fuel is usually a safe bet, Limpets also work well.",
        bgsEffect: "Variable but small for station owner",
        requirements: (systemInfo, action) => systemInfo.hasStations() && systemInfo.isInConflict() && systemInfo.isSupportingSystem()
    },
    {
        activity: "Flood markets with low value goods (U)",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: true,
        details: "Goods must sell for 500 cr or less, and be on the station market as supply or demand",
        pickup: "Station in any system",
        handIn: "Station in target system",
        notes: "The cheaper the better. Hydrogen Fuel is usually a safe bet, Limpets also work well.",
        bgsEffect: "Variable but small for station owner",
        requirements: (systemInfo, action) => systemInfo.hasStations()
    },
    {
        activity: "Holoscreen Hacking",
        acquisition: true,
        reinforcement: true,
        undermining: true,
        legal: false,
        details: "Requires Recon Limpet",
        pickup: "Orbital Starports",
        handIn: "n/a",
        notes: "In Acquisition and Undermining, rapidly damages reputation with station owner. In Reinforcement may not be available away from front lines.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasOrbitalStarports()
    },
    {
        activity: "Power Kills",
        acquisition: true,
        reinforcement: true,
        undermining: true,
        legal: false,
        details: "In Undermining systems, killing ships or soldiers belonging to another Undermining Power does nothing",
        pickup: "In Target System",
        handIn: "n/a",
        notes: "In Acquisition and Undermining, kills are illegal but do not increase notoriety",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true // Always available
    },
    {
        activity: "Retrieve Power Goods (A)",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: false,
        details: "Goods are in locked containers, ebreach or combination to open",
        pickup: "Surface settlements in target system",
        handIn: "Supporting System Power Contact",
        notes: "",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasOdysseySettlements() && systemInfo.isSupportingSystem()
    },
    {
        activity: "Retrieve Power Goods (U)",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: false,
        details: "Goods are in locked containers, ebreach or combination to open",
        pickup: "Surface settlements in target system",
        handIn: "Friendly System Power Contact",
        notes: "",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasOdysseySettlements()
    },
    {
        activity: "Scan Datalinks",
        acquisition: true,
        reinforcement: true,
        undermining: true,
        legal: true,
        details: "Scan Ship Log Uplink with Data Link Scanner",
        pickup: "Non-dockable megaships",
        handIn: "n/a",
        notes: "Only once per megaship per fortnight",
        bgsEffect: "None (unless combined with a mission to scan the same ship)",
        requirements: (systemInfo, action) => systemInfo.hasNonDockableMegaships()
    },
    {
        activity: "Scan ships and wakes",
        acquisition: "Conflict only",
        reinforcement: true,
        undermining: false,
        legal: true,
        details: "Normal scan of ships.",
        pickup: "In Target System",
        handIn: "n/a",
        notes: "Autoscans count (including your own SLF, though the merit count is far too small to be exploitable)",
        bgsEffect: "None",
        requirements: (systemInfo, action) => {
            if (action === 'acquisition') return systemInfo.isInConflict();
            return true;
        }
    },
    {
        activity: "Sell for large profits (A)",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: true,
        details: "Any cargo worth 40% or more profit",
        pickup: "Station in supporting system",
        handIn: "Station in target system",
        notes: "Once profit threshold met, more expensive goods are better. Undocumented location requirement.",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => systemInfo.hasStations() && systemInfo.isSupportingSystem()
    },
    {
        activity: "Sell for large profits (R)",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        details: "Any cargo worth 40% or more profit",
        pickup: "Station in any system",
        handIn: "Station in target system",
        notes: "Once profit threshold met, more expensive goods are better",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => systemInfo.hasStations()
    },
    {
        activity: "Sell mined resources (A)",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: true,
        details: "Sell any actually mined goods, note location requirements",
        pickup: "Mining sites in Supporting System",
        handIn: "Station in target system",
        notes: "Location requirement is unusually harsh, and not documented",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => systemInfo.hasStations() && systemInfo.hasMiningSites() && systemInfo.isSupportingSystem()
    },
    {
        activity: "Sell mined resources (R,U)",
        acquisition: false,
        reinforcement: true,
        undermining: true,
        legal: true,
        details: "Sell any actually mined goods, note location requirements",
        pickup: "Mining sites in Target System",
        handIn: "Station in target system",
        notes: "Location requirement is unusually harsh, and not documented. Merits proportional to sale price.",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => systemInfo.hasStations() && systemInfo.hasMiningSites()
    },
    {
        activity: "Sell rare goods",
        acquisition: true,
        reinforcement: true,
        undermining: false,
        legal: false,
        details: "Sell rare goods",
        pickup: "Any rare goods producer outside target system",
        handIn: "Station in target system",
        notes: "Rares must be legal in target system",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => systemInfo.hasStations() && systemInfo.areRareGoodsLegal()
    },
    {
        activity: "Transport Power Commodity (A)",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: true,
        details: "Location is crucial",
        pickup: "Power Contact in Supporting System",
        handIn: "Power Contact in Target System",
        notes: "Limited allocation per half hour, 15-250 dependent on rank. Cargo disappears at end of cycle if not delivered.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasPowerContacts() && systemInfo.isSupportingSystem()
    },
    {
        activity: "Transport Power Commodity (R)",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        details: "",
        pickup: "Power Contact in Stronghold System",
        handIn: "Power Contact in Target System",
        notes: "Limited allocation per half hour, 15-250 dependent on rank. Can't reinforce a system with its own supplies. Cargo disappears at end of cycle if not delivered.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasPowerContacts() && systemInfo.isStrongholdSystem()
    },
    {
        activity: "Transport Power Commodity (U)",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: true,
        details: "",
        pickup: "Power Contact in Stronghold System",
        handIn: "Power Contact in Target System",
        notes: "Limited allocation per half hour, 15-250 dependent on rank. Cargo disappears at end of cycle if not delivered.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasPowerContacts() && systemInfo.isStrongholdSystem()
    },
    {
        activity: "Transfer Power Data (A)",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: false,
        details: "Downloadable from data ports",
        pickup: "Odyssey settlements",
        handIn: "Supporting System Power Contact",
        notes: "Each Power has preferred types of data which give better merits. Data type chances related to data port type.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasOdysseySettlements() && systemInfo.isSupportingSystem()
    },
    {
        activity: "Transfer Power Data (R)",
        acquisition: false,
        reinforcement: "Some Types",
        undermining: false,
        legal: false,
        details: "Downloadable from data ports",
        pickup: "Odyssey settlements",
        handIn: "Same System Power Contact",
        notes: "Research and Industrial data do not work in Reinforcement",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasOdysseySettlements() && systemInfo.hasPowerContacts()
    },
    {
        activity: "Transfer Power Data (U)",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: false,
        details: "Downloadable from data ports",
        pickup: "Odyssey settlements",
        handIn: "Friendly System Power Contact",
        notes: "Each Power has preferred types of data which give better merits. Data type chances related to data port type.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasOdysseySettlements()
    },
    {
        activity: "Upload Power Malware (A)",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: false,
        details: "Upload Power Injection Malware to data ports",
        pickup: "Any Power contact",
        handIn: "Odyssey settlements in target system",
        notes: "Only one item can be uploaded per port. Long upload time.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasOdysseySettlements()
    },
    {
        activity: "Upload Power Malware (U)",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: false,
        details: "Upload Power Tracker Malware to data ports",
        pickup: "Any Power contact",
        handIn: "Odyssey settlements in target system",
        notes: "Only one item can be uploaded per port. Long upload time.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => systemInfo.hasOdysseySettlements()
    }
];

/**
 * Get available Power Play activities for a system and action type
 * @param {string} systemName - Name of the target system
 * @param {string} action - Type of action: 'acquisition', 'reinforcement', or 'undermining'
 * @param {SystemInfo} systemInfo - System information provider
 * @returns {Array} Array of available activities with their details
 */
export function getAvailableActivities(systemName, action, systemInfo) {
    if (!['acquisition', 'reinforcement', 'undermining'].includes(action)) {
        throw new Error('Invalid action type. Must be "acquisition", "reinforcement", or "undermining"');
    }

    return ACTIVITIES.filter(activity => {
        // Check if activity supports the requested action
        const supportsAction = (actionType) => {
            const actionField = activity[actionType];
            if (typeof actionField === 'boolean') return actionField;
            if (typeof actionField === 'string') {
                if (actionField === 'Yes') return true;
                if (actionField === 'No') return false;
                if (actionField === 'Conflict only') return systemInfo.isInConflict();
                if (actionField === 'Some Types') return true;
                if (actionField === 'Only versus Delaine') return true; // Would need more specific logic
                return true;
            }
            return false;
        };

        // Check if the activity supports the requested action
        if (!supportsAction(action)) return false;

        // Check system requirements
        try {
            return activity.requirements(systemInfo, action);
        } catch (error) {
            console.warn(`Error checking requirements for ${activity.activity}:`, error);
            return false;
        }
    }).map(activity => {
        // Return a copy of the activity without the requirements function
        const { requirements, ...activityDetails } = activity;
        return activityDetails;
    });
}