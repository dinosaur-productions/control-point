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

export const ACTIVITIES = [
    {
        activity: "Bounty Hunting",
        category: "Combat",
        acquisition: true,
        reinforcement: true,
        undermining: true, //"Only versus Delaine", see requirements
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Merit proportional to bounty claim, awarded on kill",
        location: "Destroy ships in target system",
        notes: "Cashing in the bounties at a friendly system Power Contact afterwards gives a bonus",
        bgsEffect: "Positive, generally for system controller",
        bonusPowers: {
            acquisition: ["A. Lavigny-Duval", "Denton Patreus", "Jerome Archer", "Yuri Grom"],
            reinforcement: ["A. Lavigny-Duval", "Denton Patreus", "Jerome Archer", "Yuri Grom"],
            undermining: []
        },
        vulnerablePowers: ["Archon Delaine"],
        requirements: (systemInfo, action) => 
            action != 'Undermine' || systemInfo.controllingPower() === 'Archon Delaine'
    },
    {
        activity: "Commit Crimes",
        category: "Combat",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Murder of clean minor faction ships or personnel",
        location: "Commit murders in target system",
        notes: "System authority appear not to count",
        bgsEffect: "Negative for ship owner (irrelevant for Power ships)",
        bonusPowers: {
            acquisition: [],
            reinforcement: [],
            undermining: ["Archon Delaine"]
        },
        vulnerablePowers: ["A. Lavigny-Duval", "Denton Patreus", "Jerome Archer", "Yuri Grom"],
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
        location: "Accept and complete missions at stations in target system",
        notes: "Static merit value regardless of reward choice.",
        bgsEffect: "Positive for mission faction",
        bonusPowers: {
            acquisition: ["Felicia Winters", "Nakato Kaine"],
            reinforcement: ["Aisling Duval", "Edmund Mahon", "Felicia Winters", "Nakato Kaine", "Pranav Antal"],
            undermining: ["Edmund Mahon", "Nakato Kaine"]
        },
        vulnerablePowers: [],
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
        location: "Accept and complete missions at stations in target system",
        notes: "Merit gain proportional to donation size for those missions, with cargo donations much more effective.",
        bgsEffect: "Positive for mission faction",
        bonusPowers: {
            acquisition: [],
            reinforcement: [],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => {
            return action !== 'Acquire' || systemInfo.isInConflict();

        }
    },
    {
        activity: "Collect Salvage", // R
        category: "Misc",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Black boxes, Personal Effects, Wreckage Components",
        location: "Collect in target system and deliver to Power Contact in target system",
        notes: "Unavailable at Anarchy stations.",
        bgsEffect: "Positive for station owner",
        bonusPowers: {
            acquisition: [],
            reinforcement: ["Archon Delaine", "Denton Patreus", "Felicia Winters", "Jerome Archer", "Pranav Antal", "Yuri Grom", "Zemina Torval"],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Collect Salvage", // U
        category: "Misc",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Black boxes, Personal Effects, Wreckage Components",
        location: "Collect in target system and deliver to friendly system Power Contact",
        notes: "Unavailable at Anarchy stations.",
        bgsEffect: "Positive for station owner",
        bonusPowers: {
            acquisition: [],
            reinforcement: [],
            undermining: ["Felicia Winters", "Pranav Antal"]
        },
        vulnerablePowers: [],
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
        location: "Scan biological samples anywhere and sell data at stations in target system",
        notes: "Data collected after 7 Nov 3310 only",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: [],
            reinforcement: ["Edmund Mahon", "Li Yong-Rui", "Nakato Kaine", "Pranav Antal"],
            undermining: []
        },
        vulnerablePowers: [],
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
        location: "Scan systems anywhere >20LY from target and sell data at stations in target system",
        notes: "Data collected after 7 Nov 3310 only",
        bgsEffect: "Positive for station owner",
        bonusPowers: {
            acquisition: [],
            reinforcement: ["Aisling Duval", "Edmund Mahon", "Li Yong-Rui", "Nakato Kaine", "Pranav Antal", "Zemina Torval"],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Flood markets with low value goods", // A
        category: "Hauling",
        acquisition: true, // "Conflict only",
        reinforcement: false,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Goods must sell for 500 cr or less, and be on the station market as supply or demand",
        location: "Buy at stations in supporting system and sell at stations in target system",
        notes: "The cheaper the better. Hydrogen Fuel is usually a safe bet, Limpets also work well.",
        bgsEffect: "Variable but small for station owner",
        bonusPowers: {
            acquisition: [],
            reinforcement: [],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => action !== 'Acquire' || systemInfo.isInConflict()
    },
    {
        activity: "Flood markets with low value goods", // U
        category: "Hauling",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Goods must sell for 500 cr or less, and be on the station market as supply or demand",
        location: "Buy at stations in any system and sell at stations in target system",
        notes: "The cheaper the better. Hydrogen Fuel is usually a safe bet, Limpets also work well.",
        bgsEffect: "Variable but small for station owner",
        bonusPowers: {
            acquisition: [],
            reinforcement: [],
            undermining: ["Li Yong-Rui", "Zemina Torval"]
        },
        vulnerablePowers: ["Edmund Mahon", "Felicia Winters", "Li Yong-Rui", "Nakato Kaine", "Pranav Antal"],
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
        location: "Hack holoscreens at orbital starports",
        notes: "In Acquisition and Undermining, rapidly damages reputation with station owner. In Reinforcement may not be available away from front lines.",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: ["Aisling Duval", "A. Lavigny-Duval", "Denton Patreus", "Felicia Winters", "Jerome Archer", "Li Yong-Rui", "Nakato Kaine"],
            reinforcement: ["Aisling Duval", "Denton Patreus", "Jerome Archer"],
            undermining: ["Aisling Duval", "A. Lavigny-Duval", "Jerome Archer", "Li Yong-Rui"]
        },
        vulnerablePowers: ["Aisling Duval", "Edmund Mahon", "Nakato Kaine"],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Power Kills",
        category: "Combat",
        acquisition: true,
        reinforcement: true,
        undermining: true,
        legal: false,
        strongholdCarrierUndermining: true,
        details: "In Undermining systems, killing ships or soldiers belonging to another Undermining Power does nothing",
        location: "Destroy Power ships or kill Power soldiers in target system",
        notes: "Legal in Power Conflict Zones (ship combat only). In Acquisition and Undermining, kills are illegal but do not increase notoriety.",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: [],
            reinforcement: ["Archon Delaine", "A. Lavigny-Duval", "Denton Patreus", "Jerome Archer", "Yuri Grom"],
            undermining: ["Archon Delaine", "A. Lavigny-Duval", "Denton Patreus", "Jerome Archer", "Yuri Grom"]
        },
        vulnerablePowers: ["Archon Delaine"],
        requirements: (systemInfo, action) => true // Always available
    },
    {
        activity: "Retrieve Power Goods", // A
        category: "On Foot",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Goods are in locked containers, ebreach or combination to open",
        location: "Retrieve from surface settlements in target system and deliver to supporting system Power Contact",
        notes: "",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: [],
            reinforcement: [],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Retrieve Power Goods", // U
        category: "On Foot",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Goods are in locked containers, ebreach or combination to open",
        location: "Retrieve from surface settlements in target system and deliver to friendly system Power Contact",
        notes: "",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: [],
            reinforcement: [],
            undermining: []
        },
        vulnerablePowers: [],
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
        location: "Scan datalinks at non-dockable megaships",
        notes: "Only once per megaship per fortnight",
        bgsEffect: "None (unless combined with a mission to scan the same ship)",
        bonusPowers: {
            acquisition: ["Archon Delaine", "Jerome Archer", "Pranav Antal", "Yuri Grom", "Zemina Torval"],
            reinforcement: ["Archon Delaine", "A. Lavigny-Duval"],
            undermining: ["Denton Patreus", "Felicia Winters", "Jerome Archer", "Yuri Grom"]
        },
        vulnerablePowers: ["A. Lavigny-Duval", "Denton Patreus"],
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
        location: "Scan ships and wakes in target system",
        notes: "Autoscans count (including your own SLF, though the merit count is far too small to be exploitable)",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: [],
            reinforcement: ["Archon Delaine", "A. Lavigny-Duval", "Denton Patreus", "Felicia Winters", "Jerome Archer", "Nakato Kaine", "Pranav Antal", "Yuri Grom"],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => action !== 'Acquire' || systemInfo.isInConflict(),
    },
    {
        activity: "Sell for large profits", //A
        category: "Hauling",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Any cargo worth 40% or more profit",
        location: "Buy at stations in supporting system and sell at stations in target system",
        notes: "Once profit threshold met, more expensive goods are better. Undocumented location requirement.",
        bgsEffect: "Positive for station owner",
        bonusPowers: {
            acquisition: ["Denton Patreus", "Edmund Mahon", "Li Yong-Rui", "Zemina Torval"],
            reinforcement: [],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Sell for large profits", //R
        category: "Hauling",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Any cargo worth 40% or more profit",
        location: "Buy at stations in any system and sell at stations in target system",
        notes: "Once profit threshold met, more expensive goods are better",
        bgsEffect: "Positive for station owner",
        bonusPowers: {
            acquisition: [],
            reinforcement: ["Aisling Duval", "Edmund Mahon", "Li Yong-Rui", "Zemina Torval"],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Sell mined resources", // A
        category: "Mining",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Sell any actually mined goods, note location requirements",
        location: "Mine at mining sites in supporting system and sell at stations in target system",
        notes: "Location requirement is unusually harsh, and not documented",
        bgsEffect: "Positive for station owner",
        bonusPowers: {
            acquisition: ["Edmund Mahon", "Nakato Kaine", "Zemina Torval"],
            reinforcement: [],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Sell mined resources", // R,U
        category: "Mining",
        acquisition: false,
        reinforcement: true,
        undermining: true,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Sell any actually mined goods, note location requirements",
        location: "Mine at mining sites in target system and sell at stations in target system",
        notes: "Merits proportional to sale price. For undermining, goods must be in demand.",
        bgsEffect: "Positive for station owner",
        bonusPowers: {
            acquisition: [],
            reinforcement: ["Edmund Mahon", "Felicia Winters", "Zemina Torval"],
            undermining: []
        },
        vulnerablePowers: ["Zemina Torval"],
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
        location: "Buy at any rare goods producer outside target system and sell at stations in target system",
        notes: "Rares must be legal in target system",
        bgsEffect: "Positive for station owner",
        bonusPowers: {
            acquisition: ["Aisling Duval", "Denton Patreus", "Edmund Mahon", "Li Yong-Rui"],
            reinforcement: ["Archon Delaine", "Li Yong-Rui"],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transport Power Commodity: Sirius Franchise Package", // A
        category: "Hauling",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "Location is crucial",
        location: "Collect Sirius Franchise Packages from Power Contact in supporting system and deliver to Power Contact in target system",
        notes: "Limited allocation per half hour, 15-250 dependent on rank. Cargo disappears at end of cycle if not delivered.",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: ["Aisling Duval", "Archon Delaine", "A. Lavigny-Duval", "Denton Patreus", "Edmund Mahon", "Felicia Winters", "Jerome Archer", "Li Yong-Rui", "Nakato Kaine", "Pranav Antal", "Yuri Grom", "Zemina Torval"],
            reinforcement: [],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transport Power Commodity: Sirius Industrial Equipment", // R
        category: "Hauling",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "",
        location: "Collect Sirius Industrial Equipmentfrom Power Contact in stronghold system and deliver to Power Contact in target system",
        notes: "Limited allocation per half hour, 15-250 dependent on rank. Can't reinforce a system with its own supplies. Cargo disappears at end of cycle if not delivered.",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: [],
            reinforcement: ["Aisling Duval", "Archon Delaine", "A. Lavigny-Duval", "Denton Patreus", "Edmund Mahon", "Felicia Winters", "Jerome Archer", "Li Yong-Rui", "Nakato Kaine", "Pranav Antal", "Yuri Grom", "Zemina Torval"],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transport Power Commodity: Sirius Corporate Contracts", // U
        category: "Hauling",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: true,
        strongholdCarrierUndermining: false,
        details: "",
        location: "Collect Sirius Corporate Contracts from Power Contact in stronghold system and deliver to Power Contact in target system",
        notes: "Limited allocation per half hour, 15-250 dependent on rank. Cargo disappears at end of cycle if not delivered.",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: [],
            reinforcement: [],
            undermining: ["Aisling Duval", "Archon Delaine", "A. Lavigny-Duval", "Denton Patreus", "Edmund Mahon", "Felicia Winters", "Jerome Archer", "Li Yong-Rui", "Nakato Kaine", "Pranav Antal", "Zemina Torval"]
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transfer Power Data", // A
        category: "On Foot",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Downloadable from data ports",
        location: "Download at Odyssey settlements and deliver to supporting system Power Contact",
        notes: "Each Power has preferred types of data which give better merits. Data type chances related to data port type.",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: ["Aisling Duval", "Archon Delaine", "A. Lavigny-Duval", "Denton Patreus", "Edmund Mahon", "Felicia Winters", "Jerome Archer", "Li Yong-Rui", "Nakato Kaine", "Pranav Antal", "Yuri Grom", "Zemina Torval"],
            reinforcement: [],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transfer Power Data", // R
        category: "On Foot",
        acquisition: false,
        reinforcement: true,
        undermining: false,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Downloadable from data ports",
        location: "Download at Odyssey settlements and deliver to same system Power Contact",
        notes: "Research and Industrial data do not work in Reinforcement. NPCs do not become hostile when downloading power data.",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: [],
            reinforcement: ["Aisling Duval", "Archon Delaine", "A. Lavigny-Duval", "Denton Patreus", "Edmund Mahon", "Felicia Winters", "Jerome Archer", "Li Yong-Rui", "Nakato Kaine", "Pranav Antal", "Yuri Grom", "Zemina Torval"],
            undermining: []
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Transfer Power Data", // U
        category: "On Foot",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Downloadable from data ports",
        location: "Download at Odyssey settlements and deliver to friendly system Power Contact",
        notes: "Each Power has preferred types of data which give better merits. Data type chances related to data port type.",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: [],
            reinforcement: [],
            undermining: ["Aisling Duval", "Archon Delaine", "A. Lavigny-Duval", "Denton Patreus", "Edmund Mahon", "Felicia Winters", "Jerome Archer", "Li Yong-Rui", "Nakato Kaine", "Zemina Torval"]
        },
        vulnerablePowers: [],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Upload Power Malware", // A
        category: "On Foot",
        acquisition: true,
        reinforcement: false,
        undermining: false,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Upload Power Injection Malware to data ports",
        location: "Collect from any Power Contact and upload at Odyssey settlements in target system",
        notes: "Only one item can be uploaded per port. Long upload time.",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: ["Archon Delaine"],
            reinforcement: [],
            undermining: []
        },
        vulnerablePowers: ["Li Yong-Rui", "Yuri Grom"],
        requirements: (systemInfo, action) => true
    },
    {
        activity: "Upload Power Malware", // U
        category: "On Foot",
        acquisition: false,
        reinforcement: false,
        undermining: true,
        legal: false,
        strongholdCarrierUndermining: false,
        details: "Upload Power Tracker Malware to data ports",
        location: "Collect from any Power Contact and upload at Odyssey settlements in target system",
        notes: "Only one item can be uploaded per port. Long upload time.",
        bgsEffect: "None",
        bonusPowers: {
            acquisition: [],
            reinforcement: [],
            undermining: []
        },
        vulnerablePowers: ["Li Yong-Rui", "Yuri Grom"],
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
            
            // Replace 'target system' in location field
            if (activityCopy.location && typeof activityCopy.location === 'string') {
                activityCopy.location = activityCopy.location.replace(/target system/g, systemName);
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