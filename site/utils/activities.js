export class SystemInfo {
    constructor({ controllingPower = '', inConflict = false } = {}) {
        this._controllingPower = controllingPower;
        this._inConflict = Boolean(inConflict);
    }

    controllingPower() {
        return this._controllingPower;
    }

    isInConflict() {
        return this._inConflict;
    }
}

const ACTIVITIES = [
    {
        activity: "Bounty Hunting",
        category: "Space Combat",
        acquisition: true,
        reinforcement: true,
        undermining: true, //"Only versus Delaine", see requirements
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Merit proportional to bounty claim, awarded on kill",
        pickup: "in target system",
        handIn: null,
        notes: "Cashing in the bounties at a friendly system Power Contact afterwards gives a bonus",
        bgsEffect: "Positive, generally for system controller",
        requirements: (systemInfo, action) => 
            action != 'Undermine' || systemInfo.controllingPower() === 'Archon Delaine'
    },
    {
        activity: "Commit Crimes",
        category: "Space Combat",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Murder of Power or minor faction ships or personnel",
        pickup: "in target system",
        handIn: null,
        notes: "System authority appear not to count",
        bgsEffect: "Negative for ship owner (irrelevant for Power ships)",
        requirements: (systemInfo, action) => true // Always available
    },
    {
        activity: "Complete Restore/Reactivate Missions",
        category: "On Foot",
        acquisition: true,
        reinforcement: true,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Any Odyssey mission in the Support category",
        pickup: "at stations in target system",
        handIn: "via Odyssey base in target system",
        notes: "Static merit value regardless of reward choice.",
        bgsEffect: "Positive for mission faction",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Complete Support Missions",
        category: "Misc",
        acquisition: true, //"Conflict only",
        reinforcement: true,
        undermining: true,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Any ship mission in the Support category",
        pickup: "at stations in target system",
        handIn: null,
        notes: "Merit gain proportional to donation size for those missions, with cargo donations much more effective.",
        bgsEffect: "Positive for mission faction",
        requirements: (systemInfo, action) => {
            return action !== 'Acquire' || systemInfo.isInConflict();

        }
    },
    {
        activity: "Collect Salvage (R)",
        category: "Misc",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Black boxes, Personal Effects, Wreckage Components",
        pickup: "in target system",
        handIn: "at Power Contact in target system",
        notes: "Unavailable at Anarchy stations.",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Collect Salvage (U)",
        category: "Misc",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Black boxes, Personal Effects, Wreckage Components",
        pickup: "in target system",
        handIn: "at friendly system Power Contact",
        notes: "Unavailable at Anarchy stations.",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Exobiology",
        category: "Misc",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "",
        pickup: "anywhere",
        handIn: "at stations in target system",
        notes: "Data collected after 7 Nov 3310 only",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Exploration Data",
        category: "Misc",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Merits per system, not per page - cheap systems get nothing",
        pickup: "anywhere >20LY from target",
        handIn: "at stations in target system",
        notes: "Data collected after 7 Nov 3310 only",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Flood markets with low value goods (A)",
        category: "Hauling",
        acquisition: true, // "Conflict only",
        reinforcement: false,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Goods must sell for 500 cr or less, and be on the station market as supply or demand",
        pickup: "at stations in supporting system",
        handIn: "at stations in target system",
        notes: "The cheaper the better. Hydrogen Fuel is usually a safe bet, Limpets also work well.",
        bgsEffect: "Variable but small for station owner",
        requirements: (systemInfo, action) => action !== 'Acquire' || systemInfo.isInConflict()
    },
    {
        activity: "Flood markets with low value goods (U)",
        category: "Hauling",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Goods must sell for 500 cr or less, and be on the station market as supply or demand",
        pickup: "at stations in any system",
        handIn: "at stations in target system",
        notes: "The cheaper the better. Hydrogen Fuel is usually a safe bet, Limpets also work well.",
        bgsEffect: "Variable but small for station owner",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Holoscreen Hacking",
        category: "Misc",
        acquisition: true,
        reinforcement: true,
        undermining: true,
        legal: false,
        strongholdCarrierUndermining: true,
        details: "Requires Recon Limpet",
        pickup: "at orbital starports",
        handIn: null,
        notes: "In Acquisition and Undermining, rapidly damages reputation with station owner. In Reinforcement may not be available away from front lines.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Power Kills",
        category: "Space Combat",
        acquisition: true,
        reinforcement: true,
        undermining: true,
        legal: false,
        strongholdCarrierUndermining: true,
        details: "In Undermining systems, killing ships or soldiers belonging to another Undermining Power does nothing",
        pickup: "in target system",
        handIn: null,
        notes: "Legal in Power Conflict Zones (ship combat only). In Acquisition and Undermining, kills are illegal but do not increase notoriety.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true // Always available
    },
    {
        activity: "Retrieve Power Goods (A)",
        category: "On Foot",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Goods are in locked containers, ebreach or combination to open",
        pickup: "in surface settlements in target system",
        handIn: "to supporting system Power Contact",
        notes: "",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Retrieve Power Goods (U)",
        category: "On Foot",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Goods are in locked containers, ebreach or combination to open",
        pickup: "in surface settlements in target system",
        handIn: "at friendly system Power Contact",
        notes: "",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Scan Datalinks",
        category: "Misc",
        acquisition: true,
        reinforcement: true,
        undermining: true,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Scan Ship Log Uplink with Data Link Scanner",
        pickup: "at non-dockable megaships",
        handIn: null,
        notes: "Only once per megaship per fortnight",
        bgsEffect: "None (unless combined with a mission to scan the same ship)",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Scan ships and wakes",
        category: "Misc",
        acquisition: true, //"Conflict only",
        reinforcement: true,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Normal scan of ships.",
        pickup: "in target system",
        handIn: null,
        notes: "Autoscans count (including your own SLF, though the merit count is far too small to be exploitable)",
        bgsEffect: "None",
        requirements: (systemInfo, action) => action !== 'Acquire' || systemInfo.isInConflict(),
    },
    {
        activity: "Sell for large profits (A)",
        category: "Hauling",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Any cargo worth 40% or more profit",
        pickup: "at stations in supporting system",
        handIn: "at stations in target system",
        notes: "Once profit threshold met, more expensive goods are better. Undocumented location requirement.",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Sell for large profits (R)",
        category: "Hauling",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Any cargo worth 40% or more profit",
        pickup: "at stations in any system",
        handIn: "at stations in target system",
        notes: "Once profit threshold met, more expensive goods are better",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Sell mined resources (A)",
        category: "Mining",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Sell any actually mined goods, note location requirements",
        pickup: "at mining sites in supporting system",
        handIn: "at stations in target system",
        notes: "Location requirement is unusually harsh, and not documented",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Sell mined resources (R,U)",
        category: "Mining",
        acquisition: false,
        reinforcement: true,
        undermining: true,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Sell any actually mined goods, note location requirements",
        pickup: "at mining sites in target system",
        handIn: "at stations in target system",
        notes: "Merits proportional to sale price. For undermining, goods must be in demand.",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Sell rare goods",
        category: "Hauling",
        acquisition: true,
        reinforcement: true,
        undermining: false,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Sell rare goods",
        pickup: "at any rare goods producer outside target system",
        handIn: "at stations in target system",
        notes: "Rares must be legal in target system",
        bgsEffect: "Positive for station owner",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transport Power Commodity (A)",
        category: "Hauling",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Location is crucial",
        pickup: "at Power Contact in supporting system",
        handIn: "to Power Contact in target system",
        notes: "Limited allocation per half hour, 15-250 dependent on rank. Cargo disappears at end of cycle if not delivered.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transport Power Commodity (R)",
        category: "Hauling",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "",
        pickup: "at Power Contact in stronghold system",
        handIn: "to Power Contact in target system",
        notes: "Limited allocation per half hour, 15-250 dependent on rank. Can't reinforce a system with its own supplies. Cargo disappears at end of cycle if not delivered.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transport Power Commodity (U)",
        category: "Hauling",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "",
        pickup: "at Power Contact in stronghold system",
        handIn: "to Power Contact in target system",
        notes: "Limited allocation per half hour, 15-250 dependent on rank. Cargo disappears at end of cycle if not delivered.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transfer Power Data (A)",
        category: "On Foot",
        acquisition: false, //true, disabled by fdev
        reinforcement: false,
        undermining: false,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Downloadable from data ports",
        pickup: "at Odyssey settlements",
        handIn: "to supporting system Power Contact",
        notes: "Each Power has preferred types of data which give better merits. Data type chances related to data port type.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transfer Power Data (R)",
        category: "On Foot",
        acquisition: false,
        reinforcement: false, //true, //"Some Types",  disabled by fdev
        undermining: false,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Downloadable from data ports",
        pickup: "at Odyssey settlements",
        handIn: "to same system Power Contact",
        notes: "Research and Industrial data do not work in Reinforcement",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transfer Power Data (U)",
        category: "On Foot",
        acquisition: false,
        reinforcement: false,
        undermining: false, //true, disabled by fdev
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Downloadable from data ports",
        pickup: "at Odyssey settlements",
        handIn: "to friendly system Power Contact",
        notes: "Each Power has preferred types of data which give better merits. Data type chances related to data port type.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Upload Power Malware (A)",
        category: "On Foot",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Upload Power Injection Malware to data ports",
        pickup: "at any Power Contact",
        handIn: "to Odyssey settlements in target system",
        notes: "Only one item can be uploaded per port. Long upload time.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Upload Power Malware (U)",
        category: "On Foot",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Upload Power Tracker Malware to data ports",
        pickup: "Any Power Contact",
        handIn: "Odyssey settlements in target system",
        notes: "Only one item can be uploaded per port. Long upload time.",
        bgsEffect: "None",
        requirements: (systemInfo, action) => true
    }
];

/**
 * Get available Power Play activities for a system and action type
 * @param {string} systemName - Name of the target system
 * @param {string} action - Type of action: 'Acquire', 'Reinforce', or 'Undermine'
 * @param {SystemInfo} systemInfo - System information provider
 * @returns {Array} Array of available activities with their details
 */
export function getAvailableActivities(systemName, action, systemInfo) {
    systemInfo = systemInfo || new SystemInfo({});

    const actionToProp = {
        Acquire: 'acquisition',
        Reinforce: 'reinforcement',
        Undermine: 'undermining'
    };

    const prop = actionToProp[action];
    if (!prop) {
        // No matching action — ensure no activities returned
        return [];
    } else {
        const filtered = ACTIVITIES.filter(act =>
            Boolean(act[prop]) &&
            (typeof act.requirements !== 'function' || act.requirements(systemInfo, action))
        );
        
        // Create deep copies and replace 'target system' with actual system name
        return filtered.map(activity => {
            const activityCopy = { ...activity };
            
            // Replace 'target system' in pickup field
            if (activityCopy.pickup && typeof activityCopy.pickup === 'string') {
                activityCopy.pickup = activityCopy.pickup.replace(/target system/g, systemName);
            }
            
            // Replace 'target system' in handIn field
            if (activityCopy.handIn && typeof activityCopy.handIn === 'string') {
                activityCopy.handIn = activityCopy.handIn.replace(/target system/g, systemName);
            }
            
            // Replace 'target system' in details field
            if (activityCopy.details && typeof activityCopy.details === 'string') {
                activityCopy.details = activityCopy.details.replace(/target system/g, systemName);
            }
            
            // Replace 'target system' in notes field
            if (activityCopy.notes && typeof activityCopy.notes === 'string') {
                activityCopy.notes = activityCopy.notes.replace(/target system/g, systemName);
            }
            
            return activityCopy;
        });
    }
}