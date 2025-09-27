class ActivityItemComponent extends HTMLElement {
    static get observedAttributes() {
        return ['activity-name', 'legal', 'details', 'pickup', 'hand-in', 'notes', 'scroll-target'];
    }

    constructor() {
        super();
        this.innerHTML = `
            <div class="activity-item">
                <div class="activity-header">
                    <span class="activity-name"></span>
                    <span class="legal-badge"></span>
                </div>
                <div class="activity-details">
                    <div class="activity-detail details"></div>
                    <div class="activity-detail pickup-handin"></div>
                    <div class="activity-detail notes" style="display: none;"></div>
                </div>
            </div>
        `;
        
        this.activityNameElement = this.querySelector('.activity-name');
        this.legalBadgeElement = this.querySelector('.legal-badge');
        this.detailsElement = this.querySelector('.details');
        this.pickupHandinElement = this.querySelector('.pickup-handin');
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
        const pickup = this.getAttribute('pickup') || '';
        const handIn = this.getAttribute('hand-in') || '';
        const notes = this.getAttribute('notes') || '';

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

        // Update details
        this.detailsElement.innerHTML = this.linkifySupportingSystems(details);

        // Update pickup/hand-in
        let pickupHandinText = '';
        if (pickup) {
            pickupHandinText = `Pick up ${this.linkifySupportingSystems(pickup)}`;
            if (handIn) {
                pickupHandinText += `, Hand in ${this.linkifySupportingSystems(handIn)}`;
            }
        }
        this.pickupHandinElement.innerHTML = pickupHandinText;

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