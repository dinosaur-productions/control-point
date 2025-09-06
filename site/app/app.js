import { registerRouteComponent } from "../components/route.js";
import { registerSystemRouteComponent } from "./system-route.js";
import { registerSystemSearchComponent } from "./system-search.js";
import { registerInfraFailuresRouteComponent } from "./infra-failures-route.js";
import { registerInfraFailuresComponent } from "./infra-failures.js";

class App extends HTMLElement {
    connectedCallback() {
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
        </footer>
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