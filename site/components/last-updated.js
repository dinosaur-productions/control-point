class LastUpdatedComponent extends HTMLElement {
    static get observedAttributes() {
        return ['timestamp', 'stale-threshold'];
    }

    constructor() {
        super();
        this.innerHTML = `
            <div class="last-updated">
                <small class="time-ago">Updated loading...</small>
                <small class="timestamp">
                    <span class="status-dot">●</span>
                    <span class="formatted-date">Loading...</span>
                </small>
            </div>
        `;
        this.timeAgoElement = this.querySelector('.time-ago');
        this.timestampElement = this.querySelector('.timestamp');
        this.statusDotElement = this.querySelector('.status-dot');
        this.formattedDateElement = this.querySelector('.formatted-date');
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        if (this.timeAgoElement) {
            this.render();
        }
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    }

    render() {
        const timestampAttr = this.getAttribute('timestamp');
        const staleThresholdHours = parseInt(this.getAttribute('stale-threshold')) || 1;
        
        if (!timestampAttr) {
            this.timeAgoElement.textContent = 'Updated unknown';
            this.formattedDateElement.textContent = 'Unknown';
            this.timestampElement.className = 'timestamp status-stale';
            return;
        }

        const timestamp = new Date(timestampAttr);
        const timeAgo = this.getTimeAgo(timestamp.getTime());
        
        // Check if stale
        const now = new Date();
        const staleThreshold = new Date(now.getTime() - staleThresholdHours * 60 * 60 * 1000);
        const isRecent = timestamp > staleThreshold;
        const statusClass = isRecent ? 'status-recent' : 'status-stale';
        
        // Format the date for display
        const formattedDate = timestamp.toLocaleString(undefined, {
            dateStyle: "short", 
            timeStyle: "short"
        });
        
        this.timeAgoElement.textContent = `Updated ${timeAgo}`;
        this.formattedDateElement.textContent = formattedDate;
        this.timestampElement.className = `timestamp ${statusClass}`;
    }
}

export function registerLastUpdatedComponent() {
    customElements.define('x-last-updated', LastUpdatedComponent);
}