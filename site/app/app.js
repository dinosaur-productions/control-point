import { registerRouteComponent } from "../components/route.js";
import { registerSystemRouteComponent } from "./system-route.js";
import { registerSystemSearchComponent } from "./system-search.js";

class App extends HTMLElement{
    connectedCallback() {
        this.innerHTML = `
        <header>
            <h1>Elite Dangerous Control Point</h1>
        </header>

        <main>
            <div class="container">
                <x-route path="/">
                    <x-system-search></x-system-search>
                </x-route>
                <x-system-route path="/system/([0-9]+)"></x-system-route>
            </div>
        </main>

        <footer>
            <p>
                Powered by <a href="https://duckdb.org">DuckDB</a> and <a href="https://cloudflare.com">Cloudflare</a>.
                Data provided by <a href="https://edgalaxydata.space/">ED Galaxy Data</a>.
            </p>
        </footer>
        `
    }
}

export const registerApp = () => {
    registerRouteComponent();
    registerSystemRouteComponent();
    registerSystemSearchComponent();
    customElements.define('x-app', App);
}