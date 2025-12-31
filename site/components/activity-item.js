class ActivityItemComponent extends HTMLElement {
    static get observedAttributes() {
        return ['activity-name', 'legal', 'details', 'location', 'notes', 'scroll-target', 'lyr-bonus', 'vulnerable'];
    }

    constructor() {
        super();
        this.innerHTML = `
            <div class="activity-item">
                <div class="activity-header">
                    <span class="activity-name"></span>
                    <span class="badges">
                        <span class="legal-badge"></span>
                        <span class="lyr-bonus-badge" style="display: none;"></span>
                        <span class="vulnerable-badge" style="display: none;"></span>
                    </span>
                </div>
                <div class="activity-details">
                    <div class="activity-detail details"></div>
                    <div class="activity-detail location"></div>
                    <div class="activity-detail notes" style="display: none;"></div>
                </div>
            </div>
        `;
        
        this.activityNameElement = this.querySelector('.activity-name');
        this.legalBadgeElement = this.querySelector('.legal-badge');
        this.lyrBonusBadgeElement = this.querySelector('.lyr-bonus-badge');
        this.vulnerableBadgeElement = this.querySelector('.vulnerable-badge');
        this.detailsElement = this.querySelector('.details');
        this.locationElement = this.querySelector('.location');
        this.notesElement = this.querySelector('.notes');
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        if (this.activityNameElement) {
            this.render();
        }
    }

    linkifySupportingSystems(text) {
        if (!text) return text;
        
        const scrollTarget = this.getAttribute('scroll-target') || 'supporting-systems-details';
        
        // Replace "supporting system" with a clickable link that scrolls to the specified target
        return text.replace(
            /supporting system/gi,
            `<a href="#" onclick="document.getElementById('${scrollTarget}')?.scrollIntoView({behavior: 'smooth'}); document.getElementById('${scrollTarget}')?.setAttribute('open', 'true'); return false;" class="internal-link">supporting system</a>`
        );
    }

    render() {
        const activityName = this.getAttribute('activity-name') || '';
        const isLegal = this.getAttribute('legal') === 'true';
        const details = this.getAttribute('details') || '';
        const location = this.getAttribute('location') || '';
        const notes = this.getAttribute('notes') || '';
        const hasLYRBonus = this.getAttribute('lyr-bonus') === 'true';
        const isVulnerable = this.getAttribute('vulnerable') === 'true';

        // Update activity name
        this.activityNameElement.textContent = activityName;

        // Update legal badge
        if (isLegal) {
            this.legalBadgeElement.className = 'legal-badge legal';
            this.legalBadgeElement.textContent = 'Legal';
        } else {
            this.legalBadgeElement.className = 'legal-badge illegal';
            this.legalBadgeElement.textContent = 'Illegal';
        }

        // Update LYR bonus badge
        if (hasLYRBonus) {
            this.lyrBonusBadgeElement.className = 'lyr-bonus-badge';
            this.lyrBonusBadgeElement.textContent = '★ LYR Bonus';
            this.lyrBonusBadgeElement.style.display = 'inline';
        } else {
            this.lyrBonusBadgeElement.style.display = 'none';
        }

        // Update vulnerable badge
        if (isVulnerable) {
            this.vulnerableBadgeElement.className = 'vulnerable-badge';
            this.vulnerableBadgeElement.textContent = '⚠ Vulnerable';
            this.vulnerableBadgeElement.style.display = 'inline';
        } else {
            this.vulnerableBadgeElement.style.display = 'none';
        }

        // Update details
        this.detailsElement.innerHTML = this.linkifySupportingSystems(details);

        // Update location
        this.locationElement.innerHTML = this.linkifySupportingSystems(location);

        // Update notes
        if (notes) {
            this.notesElement.innerHTML = `<strong>Notes:</strong> ${this.linkifySupportingSystems(notes)}`;
            this.notesElement.style.display = 'block';
        } else {
            this.notesElement.style.display = 'none';
        }
    }
}

export function registerActivityItemComponent() {
    customElements.define('x-activity-item', ActivityItemComponent);
}