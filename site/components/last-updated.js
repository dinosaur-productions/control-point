class LastUpdatedComponent extends HTMLElement {
    constructor() {
        super();
        this.manifest = null;
        this.manifestCheckInterval = null;
        this.innerHTML = `
            <p class="last-updated">
                <span class="status-dot">●</span>
                <span class="status-text">Last updated: Loading...</span>
            </p>
        `;
        this.statusElement = this.querySelector('.last-updated');
        this.statusTextElement = this.querySelector('.status-text');
    }

    async connectedCallback() {
        await this.loadManifest();
        this.render();
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
                this.render();
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

    render() {
        if (!this.manifest || !this.manifest.generated_at) {
            this.statusElement.className = 'last-updated';
            this.statusTextElement.textContent = 'Last updated: Unknown';
            return;
        }
        
        const generatedAt = new Date(this.manifest.generated_at);
        const now = new Date();
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        
        const isRecent = generatedAt > hourAgo;
        const statusClass = isRecent ? 'status-recent' : 'status-stale';
        
        // Format the date for display in local format
        const formatter = new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'numeric', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const formattedDate = formatter.format(generatedAt);
        
        this.statusElement.className = `last-updated ${statusClass}`;
        this.statusTextElement.textContent = `Last updated: ${formattedDate}`;
    }

    // Public method to manually trigger update (for compatibility)
    async updateDisplay() {
        await this.loadManifest();
        this.render();
    }
}

export function registerLastUpdatedComponent() {
    customElements.define('x-last-updated', LastUpdatedComponent);
}