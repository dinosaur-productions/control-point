import { registerRouteComponent } from "../components/route.js";
import { registerSystemActivityRouteComponent } from "./system-activity-route.js";
import { registerSystemSearchComponent } from "./system-search.js";
import { registerInfraFailuresRouteComponent } from "./infra-failures-route.js";
import { registerEnclaveComponent } from "./enclave.js";
import { registerSettlementsRouteComponent } from "./settlements-route.js";
import { registerSettlementMapsRouteComponent } from "./settlement-maps-route.js";
import { registerLastUpdatedComponent } from "../components/last-updated.js";
import { registerCheckManifestComponent } from "../components/check-manifest.js";
import { registerActivityItemComponent } from "../components/activity-item.js";
import { registerExternalLinksComponent } from "../components/external-links.js";
import { registerSortableTableComponent } from "../components/sortable-table.js";

class App extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        
        this.innerHTML = `
        <header>
            <nav class="navbar">
                <div class="navbar-brand">
                    <h2 title="Elite Dangerous Control Point">EDCP</h2>
                </div>
                <div>
                    <x-system-search></x-system-search>
                </div>
                <ul class="navbar-links">
                    <li><a href="#/infra-failures">Infra Failures</a></li>
                    <li><a href="#/enclave">Enclave</a></li>
                    <li><a href="#/settlements">Settlements</a></li>
                    <li><a href="#/settlement-maps">Settlement Maps</a></li>
                </ul>
                <x-check-manifest></x-check-manifest>
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
                <x-route path="/enclave" exact>
                    <x-enclave></x-enclave>
                </x-route>
                <x-route path="/settlements" exact>
                    <x-settlements></x-settlements>
                </x-route>
                <x-settlements-route path="/settlements/([0-9]+)"></x-settlements-route>
                <x-settlement-maps-route path="/settlement-maps(?:/([\w-]+))?"></x-settlement-maps-route>
                <x-system-activity-route path="/system/([0-9]+)"></x-system-activity-route>
            </div>
        </main>
        `;

        // Highlight current tab in navbar
        const updateActiveNav = () => {
            const path = (window.location.hash || '#/').split('?')[0];
            const links = this.querySelectorAll('.navbar-links a');
            links.forEach(a => {
                const hrefPath = (a.getAttribute('href') || '').split('?')[0];
                const isActive = hrefPath && path.startsWith(hrefPath);
                a.classList.toggle('is-active', isActive);
            });
        };
        updateActiveNav();
        window.addEventListener('hashchange', updateActiveNav);
    }
}
// TODO
// <p>
//     Data provided by <a href="https://eddn.edcd.io/">EDDN</a> via <a href="https://edgalaxydata.space/">ED Galaxy Data</a> and <a href="https://www.edsm.net/en/nightly-dumps">EDSM's Populated systems dump</a>.
// </p>

export const registerApp = () => {
    registerRouteComponent();
    registerSystemActivityRouteComponent();
    registerSystemSearchComponent();
    registerInfraFailuresRouteComponent();
    registerEnclaveComponent();
    registerSettlementsRouteComponent();
    registerSettlementMapsRouteComponent();
    registerLastUpdatedComponent();
    registerCheckManifestComponent();
    registerActivityItemComponent();
    registerExternalLinksComponent();
    registerSortableTableComponent();
    customElements.define('x-app', App);
};