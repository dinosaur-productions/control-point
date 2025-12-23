import { getDbConn } from "../index.js";
import uPlot from 'https://cdn.jsdelivr.net/npm/uplot@1.6.30/+esm';

class EnclaveComponent extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/uplot@1.6.30/dist/uPlot.min.css">
            <style>
                .enclave-power-section {
                    margin-bottom: 40px;
                    border: 1px solid #333;
                    padding: 20px;
                    border-radius: 8px;
                }
                .enclave-power-section h2 {
                    margin-top: 0;
                    border-bottom: 2px solid #444;
                    padding-bottom: 10px;
                }
                .enclave-systems-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .enclave-system-card {
                    border: 1px solid #444;
                    padding: 15px;
                    padding-left: 25px;
                    border-radius: 6px;
                    background: #1a1a1a;
                    overflow: visible;
                }
                .enclave-system-card h3 {
                    margin-top: 0;
                    font-size: 1.1em;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .enclave-system-info {
                    margin-bottom: 10px;
                    font-size: 0.9em;
                }
                .enclave-system-info .label {
                    font-weight: bold;
                    display: inline-block;
                    width: 120px;
                }
                .enclave-chart-container {
                    margin-top: 15px;
                    padding-left: 10px;
                    overflow: visible;
                }
                .enclave-chart-container .u-wrap {
                    color: #fff;
                }
                .enclave-chart-container .u-legend {
                    color: #fff;
                }
                .enclave-chart-container .u-axis text {
                    fill: #fff;
                }
                .enclave-chart-container .u-over {
                    text-anchor: end;
                }
                .enclave-chart-container .u-axis.u-off.x .u-label {
                    transform: rotate(-45deg);
                    transform-origin: right center;
                    text-anchor: end;
                }
                .state-exploited { color: #4CAF50; }
                .state-fortified { color: #2196F3; }
                .state-stronghold { color: #9C27B0; }
                .state-unoccupied { color: #888; }
                .activity-acquire { color: #FF9800; }
                .activity-reinforce { color: #4CAF50; }
                .activity-undermine { color: #F44336; }
            </style>
            <div class="enclave">
                <h1>Enclave Systems (49 Systems)</h1>
                <div class="loading">Loading enclave data...</div>
                <div class="content" style="display: none;"></div>
            </div>
        `;
        this.container = this.querySelector('.enclave');
        this.loadingElement = this.querySelector('.loading');
        this.contentElement = this.querySelector('.content');
        this.charts = [];
    }

    async connectedCallback() {
        await this.loadData();
    }

    async onActive() {
        // Reload data when component becomes active (via route or direct URL)
        await this.loadData();
    }

    disconnectedCallback() {
        // Clean up charts when component is removed
        this.charts.forEach(chart => chart.destroy());
        this.charts = [];
    }

    async loadData() {
        try {
            const conn = await getDbConn();
            
            // Calculate last Thursday 7 AM
            const now = new Date();
            const lastThursday = new Date(now);
            const daysToSubtract = (now.getDay() + 3) % 7;
            lastThursday.setDate(now.getDate() - daysToSubtract);
            lastThursday.setHours(7, 0, 0, 0);
            const lastThursdayStr = lastThursday.toISOString().replace('T', ' ').substring(0, 19);

            // Get current system states (latest record for each system)
            const systemsQuery = await conn.query(`
                WITH latest AS (
                    SELECT 
                        StarSystem,
                        MAX(timestamp) as max_timestamp
                    FROM enclave_activity
                    GROUP BY StarSystem
                )
                SELECT 
                    e.StarSystem,
                    e.ControllingPower,
                    e.PowerplayState,
                    e.reinforcement as PowerplayStateReinforcement,
                    e.undermining as PowerplayStateUndermining,
                    COALESCE(e.Powers, []) as Powers
                FROM enclave_activity e
                INNER JOIN latest l 
                    ON e.StarSystem = l.StarSystem 
                    AND e.timestamp = l.max_timestamp
                ORDER BY e.ControllingPower, e.StarSystem
            `);

            const systems = systemsQuery.toArray().map(row => row.toJSON());

            // Get historical data for all systems
            const historyQuery = await conn.query(`
                SELECT 
                    StarSystem,
                    timestamp,
                    reinforcement,
                    undermining
                FROM enclave_activity
                WHERE timestamp >= '${lastThursdayStr}'
                ORDER BY StarSystem, timestamp
            `);

            const historyData = historyQuery.toArray().map(row => row.toJSON());

            // Group systems by power
            const systemsByPower = this.groupSystemsByPower(systems, historyData);

            this.loadingElement.style.display = 'none';
            this.contentElement.style.display = 'block';
            
            this.renderPowerSections(systemsByPower);

        } catch (err) {
            console.error("Error loading enclave data:", err);
            this.loadingElement.innerHTML = `<p>Error loading enclave data: ${err.message}</p>`;
        }
    }

    groupSystemsByPower(systems, historyData) {
        const grouped = {};

        systems.forEach(system => {
            const power = system.ControllingPower || 'Uncontrolled';
            if (!grouped[power]) {
                grouped[power] = {
                    controlled: []
                };
            }

            // Get historical data for this system
            const systemHistory = historyData.filter(h => h.StarSystem === system.StarSystem);

            const systemWithHistory = {
                ...system,
                history: systemHistory
            };

            grouped[power].controlled.push(systemWithHistory);
        });

        return grouped;
    }

    renderPowerSections(systemsByPower) {
        let html = '';

        const powers = Object.keys(systemsByPower).sort((a, b) => {
            if (a === 'Uncontrolled') return 1;
            if (b === 'Uncontrolled') return -1;
            return a.localeCompare(b);
        });

        powers.forEach(power => {
            const data = systemsByPower[power];
            
            html += `
                <div class="enclave-power-section">
                    <h2>${power}</h2>
                    
                    ${data.controlled.length > 0 ? `
                        <h3>Controlled Systems (${data.controlled.length})</h3>
                        <div class="enclave-systems-grid" id="controlled-${this.sanitizePower(power)}">
                        </div>
                    ` : ''}
                </div>
            `;
        });

        this.contentElement.innerHTML = html;

        // Now render each system's card and chart
        powers.forEach(power => {
            const data = systemsByPower[power];
            
            if (data.controlled.length > 0) {
                const container = this.contentElement.querySelector(`#controlled-${this.sanitizePower(power)}`);
                data.controlled.forEach(system => {
                    this.renderSystemCard(container, system);
                });
            }
        });
    }

    renderSystemCard(container, system) {
        const cardId = `system-${this.sanitizeId(system.StarSystem)}`;
        const chartId = `chart-${this.sanitizeId(system.StarSystem)}`;

        const card = document.createElement('div');
        card.className = 'enclave-system-card';
        card.innerHTML = `
            <h3>
                <span>${system.StarSystem}</span>
                <span class="state-${system.PowerplayState?.toLowerCase() || 'unoccupied'}">${system.PowerplayState || 'Unoccupied'}</span>
            </h3>
            <div class="enclave-chart-container" id="${chartId}"></div>
        `;

        container.appendChild(card);

        // Render chart
        if (system.history && system.history.length > 0) {
            setTimeout(() => this.renderChart(chartId, system), 0);
        } else {
            const chartContainer = card.querySelector(`#${chartId}`);
            chartContainer.innerHTML = '<em>No historical data available</em>';
        }
    }

    renderChart(containerId, system) {
        const chartContainer = document.getElementById(containerId);
        if (!chartContainer) return;

        // Prepare data for uPlot
        const timestamps = system.history.map(h => new Date(h.timestamp).getTime() / 1000);
        const reinforcement = system.history.map(h => h.reinforcement || 0);
        const undermining = system.history.map(h => h.undermining || 0);

        // Calculate 8-hour rolling average rates (CP/hour)
        const windowSeconds = 8 * 3600; // 8 hours in seconds
        const reinfRate = timestamps.map((t, i) => {
            if (i === 0) return null;
            // Look back 8 hours
            const windowStart = t - windowSeconds;
            let startIdx = i;
            for (let j = i - 1; j >= 0; j--) {
                if (timestamps[j] < windowStart) break;
                startIdx = j;
            }
            const timeDiff = (t - timestamps[startIdx]) / 3600; // hours
            if (timeDiff === 0) return null;
            const cpDiff = reinforcement[i] - reinforcement[startIdx];
            return Math.round(cpDiff / timeDiff);
        });

        const undermRate = timestamps.map((t, i) => {
            if (i === 0) return null;
            // Look back 8 hours
            const windowStart = t - windowSeconds;
            let startIdx = i;
            for (let j = i - 1; j >= 0; j--) {
                if (timestamps[j] < windowStart) break;
                startIdx = j;
            }
            const timeDiff = (t - timestamps[startIdx]) / 3600; // hours
            if (timeDiff === 0) return null;
            const cpDiff = undermining[i] - undermining[startIdx];
            return Math.round(cpDiff / timeDiff);
        });

        const data = [
            timestamps,
            reinforcement,
            undermining,
            reinfRate,
            undermRate
        ];

        const opts = {
            width: chartContainer.offsetWidth || 450,
            height: 200,
            series: [
                {},
                {
                    label: "Reinforcement",
                    stroke: "#4CAF50",
                    width: 1,
                    points: { show: true, size: 5, fill: "#4CAF50" },
                    scale: "cp"
                },
                {
                    label: "Undermining",
                    stroke: "#F44336",
                    width: 1,
                    points: { show: true, size: 5, fill: "#F44336" },
                    scale: "cp"
                },
                {
                    label: "Reinf Rate (8h avg)",
                    stroke: "#81C784",
                    width: 1,
                    dash: [5, 5],
                    scale: "rate"
                },
                {
                    label: "Underm Rate (8h avg)",
                    stroke: "#E57373",
                    width: 1,
                    dash: [5, 5],
                    scale: "rate"
                }
            ],
            axes: [
                {
                    space: 60,
                    incrs: [
                        3600,
                        7200,
                        14400,
                        28800,
                        43200,
                        86400,
                    ],
                    values: (u, vals) => vals.map(v => {
                        const d = new Date(v * 1000);
                        const day = d.getDate().toString().padStart(2, '0');
                        const hour = d.getHours().toString().padStart(2, '0');
                        const min = d.getMinutes().toString().padStart(2, '0');
                        return `${day} ${hour}:${min}`;
                    }),
                    stroke: "#fff",
                    grid: { stroke: "#333" },
                },
                {
                    scale: "cp",
                    stroke: "#fff",
                    grid: { stroke: "#333" },
                    side: 3,
                },
                {
                    scale: "rate",
                    stroke: "#aaa",
                    grid: { show: false },
                    side: 1,
                    size: 80,
                    label: "CP/h",
                    labelSize: 10,
                    values: (u, vals) => vals.map(v => Math.round(v).toString()),
                }
            ],
            scales: {
                x: {
                    time: true,
                },
                cp: {},
                rate: {
                    auto: true
                }
            },
            legend: {
                show: true
            },
            padding: [0, 0, 0, 15],
            plugins: [
                {
                    hooks: {
                        drawAxes: (u) => {
                            const ctx = u.ctx;
                            const { left, top, width, height } = u.bbox;
                            
                            ctx.save();
                            
                            // Draw alternating day bands
                            const dayStart = new Date(timestamps[0] * 1000);
                            dayStart.setHours(0, 0, 0, 0);
                            
                            const dayEnd = new Date(timestamps[timestamps.length - 1] * 1000);
                            dayEnd.setHours(23, 59, 59, 999);
                            
                            let currentDay = new Date(dayStart);
                            let dayIndex = 0;
                            
                            // Get plot area bounds
                            const plotLeft = u.valToPos(u.scales.x.min, 'x', true);
                            const plotRight = u.valToPos(u.scales.x.max, 'x', true);
                            
                            while (currentDay <= dayEnd) {
                                const nextDay = new Date(currentDay);
                                nextDay.setDate(nextDay.getDate() + 1);
                                
                                let x1 = u.valToPos(currentDay.getTime() / 1000, 'x', true);
                                let x2 = u.valToPos(nextDay.getTime() / 1000, 'x', true);
                                
                                // Clamp to plot bounds
                                x1 = Math.max(x1, plotLeft);
                                x2 = Math.min(x2, plotRight);
                                
                                if (dayIndex % 2 === 0 && x2 > x1) {
                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                                    ctx.fillRect(x1, top, x2 - x1, height);
                                }
                                
                                dayIndex++;
                                currentDay = nextDay;
                            }
                            
                            ctx.restore();
                        }
                    }
                }
            ]
        };

        try {
            const chart = new uPlot(opts, data, chartContainer);
            this.charts.push(chart);
            
            // Set cursor to last point to show values in legend by default
            const lastIdx = timestamps.length - 1;
            chart.setCursor({ left: chart.valToPos(timestamps[lastIdx], 'x') });
        } catch (err) {
            console.error(`Error rendering chart for ${system.StarSystem}:`, err);
            chartContainer.innerHTML = '<em>Error rendering chart</em>';
        }
    }

    sanitizePower(power) {
        return power.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    }

    sanitizeId(systemName) {
        return systemName.replace(/[^a-zA-Z0-9]/g, '-');
    }
}

export const registerEnclaveComponent = () => {
    customElements.define('x-enclave', EnclaveComponent);
};
