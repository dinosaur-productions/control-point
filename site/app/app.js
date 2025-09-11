import { registerRouteComponent } from "../components/route.js";
import { registerSystemRouteComponent } from "./system-route.js";
import { registerSystemSearchComponent } from "./system-search.js";
import { registerInfraFailuresRouteComponent } from "./infra-failures-route.js";
import { registerInfraFailuresComponent } from "./infra-failures.js";

class App extends HTMLElement {
    async connectedCallback() {
        // Load manifest data for footer
        await this.loadManifest();
        
        this.innerHTML = `
        <header>
            <nav class="navbar">
                <div class="navbar-brand">
                    <h2>Elite Dangerous Control Point</h2>
                </div>
                <div>
                    <x-system-search></x-system-search>
                </div>
                <ul class="navbar-links">
                    <li><a href="#/infra-failures">Infra Failures</a></li>
                    <li><a href="#/mine">Mine</a></li>
                    <li><a href="#/acquire">Acquire</a></li>
                    <li><a href="#/reinforce">Reinforce</a></li>
                    <li><a href="#/undermine">Undermine</a></li>
                </ul>
            </nav>
        </header>

        <main>
            <div class="container">
                <x-route path="/" exact>
                    <x-system-search></x-system-search>
                </x-route>
                <x-route path="/infra-failures" exact>
                    <x-infra-failures></x-infra-failures>
                </x-route>
                <x-infra-failures-route path="/infra-failures/([0-9]+)"></x-infra-failures-route>
                <x-route path="/mine" exact>
                    <x-mine></x-mine>
                </x-route>
                <x-route path="/acquire">
                    <x-contest></x-acquire>
                </x-route>
                <x-route path="/reinforce">
                    <x-reinforce></x-reinforce>
                </x-route>
                <x-route path="/undermine">
                    <x-undermine></x-undermine>
                </x-route>
                <x-system-route path="/system/([0-9]+)"></x-system-route>
            </div>
        </main>

        <footer>
            <p>
                Data provided by <a href="https://eddn.edcd.io/">EDDN</a> via <a href="https://edgalaxydata.space/">ED Galaxy Data</a> and <a href="https://www.edsm.net/en/nightly-dumps">EDSM's Populated systems dump</a>.
            </p>
            ${this.renderLastUpdated()}
        </footer>
        `;
    }
    
    async loadManifest() {
        try {
            const response = await fetch('site-data_manifest.json');
            if (response.ok) {
                this.manifest = await response.json();
            } else {
                console.warn('Could not load manifest file');
                this.manifest = null;
            }
        } catch (error) {
            console.warn('Error loading manifest:', error);
            this.manifest = null;
        }
    }
    
    renderLastUpdated() {
        if (!this.manifest || !this.manifest.generated_at) {
            return '<p class="last-updated">Last updated: Unknown</p>';
        }
        
        const generatedAt = new Date(this.manifest.generated_at);
        const now = new Date();
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        
        const isRecent = generatedAt > hourAgo;
        const statusClass = isRecent ? 'status-recent' : 'status-stale';
        const statusDot = isRecent ? '🟢' : '🔴';
        
        // Format the date for display
        const formatter = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        
        const formattedDate = formatter.format(generatedAt);
        
        return `
            <p class="last-updated ${statusClass}">
                <span class="status-dot">${statusDot}</span>
                Last updated: ${formattedDate}
            </p>
        `;
    }
}

export const registerApp = () => {
    registerRouteComponent();
    registerSystemRouteComponent();
    registerSystemSearchComponent();
    registerInfraFailuresRouteComponent();
    customElements.define('x-app', App);
};