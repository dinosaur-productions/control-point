class CheckManifestComponent extends HTMLElement {
    constructor() {
        super();
        this.manifest = null;
        this.manifestCheckInterval = null;
        this.innerHTML = `<x-last-updated></x-last-updated>`;
        this.lastUpdatedElement = this.querySelector('x-last-updated');
    }

    async connectedCallback() {
        await this.loadManifest();
        this.updateLastUpdatedDisplay();
        this.startManifestChecking();
    }

    disconnectedCallback() {
        // Clean up the interval when component is removed
        if (this.manifestCheckInterval) {
            clearInterval(this.manifestCheckInterval);
        }
    }

    startManifestChecking() {
        // Check every minute for manifest updates
        this.manifestCheckInterval = setInterval(async () => {
            const previousGeneratedAt = this.manifest?.generated_at;
            await this.loadManifest();
            
            // If the manifest has been updated, refresh the display
            if (this.manifest?.generated_at !== previousGeneratedAt) {
                this.updateLastUpdatedDisplay();
            }
        }, 60 * 1000); // 1 minute
    }

    async loadManifest() {
        try {
            const response = await fetch('sitedata_manifest.json');
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

    updateLastUpdatedDisplay() {
        if (this.manifest && this.manifest.generated_at) {
            this.lastUpdatedElement.setAttribute('timestamp', this.manifest.generated_at);
            // Use configurable stale threshold, default to 1 hour
            const staleThreshold = this.getAttribute('stale-threshold') || '1';
            this.lastUpdatedElement.setAttribute('stale-threshold', staleThreshold);
        } else {
            this.lastUpdatedElement.removeAttribute('timestamp');
        }
    }

    // Public method to manually trigger update (for compatibility)
    async updateDisplay() {
        await this.loadManifest();
        this.updateLastUpdatedDisplay();
    }
}

export function registerCheckManifestComponent() {
    customElements.define('x-check-manifest', CheckManifestComponent);
}