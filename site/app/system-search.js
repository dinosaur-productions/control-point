import { searchSystems } from "../data-access.js";
import { registerAutoCompleteComponent } from "../components/autocomplete.js";

class SystemSearchComponent extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `<x-autocomplete placeholder="Enter system name..."></x-autocomplete>`;
        this.ac = this.querySelector('x-autocomplete');
    }

    connectedCallback() {
        this.init();
    }

    async init() {
        this.ac.setLoading(true);
        // Initialize connection by calling data access function
        await searchSystems("__init__");
        this.ac.setLoading(false);

        this.ac.addEventListener('search', async (e) => {
            const val = e.detail;
            if (!val) {
                this.ac.setOptions([]);
                return;
            }
            const options = await searchSystems(val);
            this.ac.setOptions(options);
        });

        this.ac.addEventListener('select', (e) => {
            const selected = e.detail;
            if (selected && selected.SystemAddress) {
                window.location.href = `#/system/${encodeURIComponent(selected.SystemAddress)}`;
            }
        });
    }
}


export function registerSystemSearchComponent() {
    registerAutoCompleteComponent();
    customElements.define('x-system-search', SystemSearchComponent);
}