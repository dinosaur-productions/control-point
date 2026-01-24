const ASSET_BASE = '.';

class SettlementMaps extends HTMLElement {
    static get observedAttributes() {
        return ['selected-id'];
    }
    constructor() {
        super();
        this.settlements = [];
        this.categories = new Map();
        this.meta = new Map();
        this.icons = new Map();
        this.currentSelectedId = null;
        this.pendingSelectedId = null;
    }

    connectedCallback() {
        this.renderShell();
        this.cacheRefs();
        this.attachListeners();
        // Apply any filters present in the current hash query
        this.parseFiltersFromHash();
        this.loadData();
    }

    renderShell() {
        this.innerHTML = `
        <section class="settlement-maps">
            <div class="sm-header">
                <div class="sm-actions">
                    <button type="button" class="sm-button sm-button-ghost" data-ref="reset">Reset filters</button>
                </div>
            </div>

            <div class="sm-layout">
                <aside class="sm-filter" data-ref="filter-panel">
                    <div class="sm-filter__section">
                        <label class="sm-label">Economy type
                            <select class="sm-select" data-ref="economy">
                                <option value="all">All</option>
                                <option value="agricultural">Agricultural</option>
                                <option value="extraction">Extraction</option>
                                <option value="industrial">Industrial</option>
                                <option value="military">Military</option>
                                <option value="hightech">High Tech</option>
                                <option value="tourist">Tourist</option>
                            </select>
                        </label>
                    </div>
                    <div class="sm-filter__section">
                        <h3 class="sm-filter__title">Landing pads</h3>
                        <label class="sm-label sm-pad">Small
                            <select class="sm-select" data-ref="pad-small">
                                <option value="any">Any</option>
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </label>
                        <label class="sm-label sm-pad">Medium
                            <select class="sm-select" data-ref="pad-medium">
                                <option value="any">Any</option>
                                <option value="0">0</option>
                                <option value="1">1</option>
                            </select>
                        </label>
                        <label class="sm-label sm-pad">Large
                            <select class="sm-select" data-ref="pad-large">
                                <option value="any">Any</option>
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                            </select>
                        </label>
                    </div>
                </aside>

                <section class="sm-grid" aria-live="polite" data-ref="grid">
                    <div class="sm-empty">Loading settlement maps...</div>
                </section>
            </div>

            <div class="sm-modal" data-ref="modal" aria-modal="true" role="dialog">
                <div class="sm-modal__content">
                    <button type="button" class="sm-modal__close" aria-label="Close" data-ref="modal-close">×</button>
                    <div class="sm-modal__controls">
                        <button type="button" class="sm-button" data-ref="toggle-icons">Toggle terminals & doors</button>
                    </div>
                    <div class="sm-map">
                        <img class="sm-map__image" data-ref="image" alt="Settlement map" loading="lazy" />
                        <div class="sm-map__icons" data-ref="icon-layer"></div>
                    </div>
                </div>
            </div>
        </section>
        `;
    }

    cacheRefs() {
        this.refs = {
            grid: this.querySelector('[data-ref="grid"]'),
            economy: this.querySelector('[data-ref="economy"]'),
            padSmall: this.querySelector('[data-ref="pad-small"]'),
            padMedium: this.querySelector('[data-ref="pad-medium"]'),
            padLarge: this.querySelector('[data-ref="pad-large"]'),
            reset: this.querySelector('[data-ref="reset"]'),
            modal: this.querySelector('[data-ref="modal"]'),
            modalClose: this.querySelector('[data-ref="modal-close"]'),
            toggleIcons: this.querySelector('[data-ref="toggle-icons"]'),
            image: this.querySelector('[data-ref="image"]'),
            iconLayer: this.querySelector('[data-ref="icon-layer"]'),
        };
        this.refs.filters = [this.refs.economy, this.refs.padSmall, this.refs.padMedium, this.refs.padLarge];
    }

    attachListeners() {
        this.refs.filters.forEach(el => el?.addEventListener('change', () => {
            // Update hash with current filters for linkability
            this.updateHashFilters(Boolean(this.currentSelectedId));
            this.renderGrid();
        }));
        this.refs.reset?.addEventListener('click', () => this.resetFilters());
        this.refs.modalClose?.addEventListener('click', () => this.closeModal());
        this.refs.modal?.addEventListener('click', (e) => {
            if (e.target === this.refs.modal) this.closeModal();
        });
        this.refs.toggleIcons?.addEventListener('click', () => this.toggleIcons());
        window.addEventListener('resize', () => this.positionIcons());
        // Re-parse filters on hash changes triggered by external links
        window.addEventListener('hashchange', () => {
            this.parseFiltersFromHash();
            this.renderGrid();
        });
    }

    async loadData() {
        try {
            const res = await fetch(`${ASSET_BASE}/data/settlements.json`);
            const data = await res.json();
            this.settlements = data.settlements || [];
            (data.categories || []).forEach(cat => this.categories.set(cat.id, cat));

            await Promise.all(this.settlements.map(s => this.loadSettlementFile(s.id)));
            this.renderGrid();
            // If an id was set via route before data loaded, open it now
            if (this.pendingSelectedId) {
                const pid = this.pendingSelectedId;
                this.pendingSelectedId = null;
                this.openSettlement(pid);
            }
        } catch (err) {
            console.error(err);
            if (this.refs.grid) this.refs.grid.innerHTML = '<div class="sm-empty">Failed to load settlements.</div>';
        }
    }

    async loadSettlementFile(id) {
        if (this.meta.has(id) && this.icons.has(id)) return;
        try {
            const res = await fetch(`${ASSET_BASE}/data/${id}.json`);
            const data = await res.json();
            const first = Array.isArray(data) && data.length ? data[0] : {};
            const meta = {
                name: first.name || '',
                landingPads: first.landingPads || { small: 0, medium: 0, large: 0 },
                dataports: first.dataports || 0,
            };
            this.meta.set(id, meta);
            const icons = Array.isArray(data) ? data.slice(1) : [];
            this.icons.set(id, icons.map(icon => this.normalizeIcon(icon)));
        } catch (err) {
            console.error(err);
            this.meta.set(id, { name: '', landingPads: { small: 0, medium: 0, large: 0 }, dataports: 0 });
            this.icons.set(id, []);
        }
    }

    resetFilters() {
        if (this.refs.economy) this.refs.economy.value = 'all';
        if (this.refs.padSmall) this.refs.padSmall.value = 'any';
        if (this.refs.padMedium) this.refs.padMedium.value = 'any';
        if (this.refs.padLarge) this.refs.padLarge.value = 'any';
        // Reflect cleared filters in the route (preserve id if modal open)
        this.updateHashFilters(Boolean(this.currentSelectedId));
        this.renderGrid();
    }

    matchesFilters(settlement) {
        const meta = this.meta.get(settlement.id) || { landingPads: { small: 0, medium: 0, large: 0 } };
        const pads = meta.landingPads || { small: 0, medium: 0, large: 0 };
        const economy = this.refs.economy?.value || 'all';
        const small = this.refs.padSmall?.value || 'any';
        const medium = this.refs.padMedium?.value || 'any';
        const large = this.refs.padLarge?.value || 'any';

        if (economy !== 'all' && settlement.category !== economy) return false;
        if (small !== 'any' && pads.small !== Number(small)) return false;
        if (medium !== 'any' && pads.medium !== Number(medium)) return false;
        if (large !== 'any' && pads.large !== Number(large)) return false;
        return true;
    }

    renderGrid() {
        if (!this.refs.grid) return;
        this.refs.grid.innerHTML = '';
        if (!this.settlements.length) {
            this.refs.grid.innerHTML = '<div class="sm-empty">No settlements available.</div>';
            return;
        }

        const groups = new Map();
        this.categories.forEach((cat, id) => groups.set(id, { meta: cat, items: [] }));

        this.settlements.forEach(s => {
            if (!this.matchesFilters(s)) return;
            const bucket = groups.get(s.category) || { meta: { name: s.category }, items: [] };
            bucket.items.push(s);
            groups.set(s.category, bucket);
        });

        const frag = document.createDocumentFragment();
        groups.forEach(group => {
            if (!group.items.length) return;
            const section = document.createElement('section');
            section.className = 'sm-group';

            // Removed category headers (Agricultural, Extraction, etc.)
            const row = document.createElement('div');
            row.className = 'sm-group__row';
            group.items.forEach(settlement => row.appendChild(this.buildCard(settlement)));
            section.appendChild(row);

            frag.appendChild(section);
        });

        if (!frag.childNodes.length) {
            this.refs.grid.innerHTML = '<div class="sm-empty">No settlements match these filters.</div>';
        } else {
            this.refs.grid.appendChild(frag);
        }
    }

    buildCard(settlement) {
        const meta = this.meta.get(settlement.id) || { name: '' };
        const card = document.createElement('article');
        card.className = 'sm-card';
        card.dataset.id = settlement.id;

        const img = document.createElement('img');
        img.src = `${ASSET_BASE}/${settlement.images.thumb}`;
        img.alt = `${settlement.id} thumbnail`;
        img.loading = 'lazy';
        card.appendChild(img);

        const body = document.createElement('div');
        body.className = 'sm-card__body';

        const title = document.createElement('div');
        title.className = 'sm-card__title';
        title.textContent = `${this.categoryName(settlement.category)} ${this.extractNumber(settlement.id)} - ${meta.name || 'Unknown'}`;
        body.appendChild(title);

        const metaRow = document.createElement('div');
        metaRow.className = 'sm-card__meta';
        
        const pads = meta.landingPads || { small: 0, medium: 0, large: 0 };
        const padParts = [];
        if (pads.small) padParts.push(`S:${pads.small}`);
        if (pads.medium) padParts.push(`M:${pads.medium}`);
        if (pads.large) padParts.push(`L:${pads.large}`);
        
        const padsSpan = document.createElement('span');
        padsSpan.textContent = padParts.length ? padParts.join(' ') : '';
        metaRow.appendChild(padsSpan);
        
        if (meta.dataports) {
            const dataportsSpan = document.createElement('span');
            dataportsSpan.textContent = `D:${meta.dataports}`;
            metaRow.appendChild(dataportsSpan);
        }
        
        body.appendChild(metaRow);

        card.appendChild(body);
        card.addEventListener('click', () => this.openSettlement(settlement.id));
        return card;
    }

    async openSettlement(id) {
        const settlement = this.settlements.find(s => s.id === id);
        if (!settlement) return;

        const imgPath = `${ASSET_BASE}/${settlement.images.full}`;
        this.currentSelectedId = id;
        if (this.refs.iconLayer) this.refs.iconLayer.innerHTML = '';
        if (this.refs.image) {
            this.refs.image.alt = `${settlement.id} settlement map`;
            this.refs.image.onload = () => {
                this.drawIcons(id);
                this.positionIcons();
            };
            this.refs.image.src = imgPath;
            if (this.refs.image.complete && this.refs.image.naturalWidth > 0) {
                this.drawIcons(id);
                this.positionIcons();
            }
        }
        // Include selected id and current filters in the hash
        this.updateHashFilters(true);
        this.refs.modal?.classList.add('is-active');
    }

    closeModal() {
        this.refs.modal?.classList.remove('is-active');
        // Remove selected id from hash but keep filters
        this.currentSelectedId = null;
        this.updateHashFilters(false);
    }

    toggleIcons() {
        const layer = this.refs.iconLayer;
        if (!layer) return;
        layer.querySelectorAll('.sm-icon--terminal, .sm-icon--door').forEach(el => {
            el.classList.toggle('is-hidden');
        });
    }

    drawIcons(id) {
        const icons = this.icons.get(id) || [];
        if (!this.refs.iconLayer) return;
        this.refs.iconLayer.innerHTML = '';
        const frag = document.createDocumentFragment();
        icons.forEach(icon => {
            const el = this.createOverlay(icon);
            if (el) frag.appendChild(el);
        });
        this.refs.iconLayer.appendChild(frag);
    }

    createOverlay(icon) {
        const type = icon?.type;
        if (!type) return null;
        const el = document.createElement('div');
        el.className = 'sm-icon';
        el.dataset.x = String(icon.x || 0);
        el.dataset.y = String(icon.y || 0);

        if (['terminal', 'plus_terminal'].includes(type)) {
            el.classList.add('sm-icon--terminal');
            el.textContent = type === 'plus_terminal' ? 'T^' : 'T';
        } else if (type === 'door') {
            el.classList.add('sm-icon--door');
            const doorType = icon.door_type || 'inner';
            const access = Number.isFinite(icon.access) ? icon.access : 0;
            el.classList.add(`sm-icon--door-${doorType}`);
            el.textContent = `${doorType === 'airlock' ? 'A' : 'D'}${access}`;
        } else if (['power', 'alarm'].includes(type)) {
            el.classList.add('sm-icon--power');
            el.textContent = type === 'alarm' ? 'A' : 'P';
        } else {
            el.classList.add('sm-icon--label', `sm-icon--label-${type.toLowerCase()}`);
            el.textContent = type;
        }
        return el;
    }

    positionIcons() {
        const img = this.refs.image;
        const layer = this.refs.iconLayer;
        if (!img || !layer) return;
        const naturalW = img.naturalWidth || 1;
        const naturalH = img.naturalHeight || 1;
        const scaleX = (img.clientWidth || naturalW) / naturalW;
        const scaleY = (img.clientHeight || naturalH) / naturalH;
        layer.querySelectorAll('.sm-icon').forEach(icon => {
            const ox = parseFloat(icon.dataset.x || '0');
            const oy = parseFloat(icon.dataset.y || '0');
            icon.style.left = `${ox * scaleX}px`;
            icon.style.top = `${oy * scaleY}px`;
        });
    }

    normalizeIcon(icon) {
        const norm = { ...icon };
        if (norm.type === 'door') {
            norm.door_type = norm.door_type || norm.doorType || 'inner';
            const access = Number.isFinite(norm.access) ? norm.access : 0;
            norm.access = Math.max(0, Math.min(3, access));
        }
        return norm;
    }

    categoryName(id) {
        return this.categories.get(id)?.name || id;
    }

    extractNumber(id) {
        const m = id.match(/[0-9]+/);
        return m ? m[0] : '';
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name !== 'selected-id' || oldValue === newValue) return;
        const id = newValue || null;
        if (id) {
            // If data is ready, open immediately; else defer
            if (this.settlements && this.settlements.length) {
                this.openSettlement(id);
            } else {
                this.pendingSelectedId = id;
            }
        } else {
            // Attribute removed -> close modal
            this.closeModal();
        }
    }

    // --- Routing helpers for filter linkability ---
    parseFiltersFromHash() {
        const hash = window.location.hash || '';
        const idx = hash.indexOf('?');
        if (idx === -1) return;
        const params = new URLSearchParams(hash.slice(idx + 1));
        const economy = params.get('economy');
        const small = params.get('small');
        const medium = params.get('medium');
        const large = params.get('large');
        if (economy && this.refs.economy) this.refs.economy.value = economy;
        if (small && this.refs.padSmall) this.refs.padSmall.value = small;
        if (medium && this.refs.padMedium) this.refs.padMedium.value = medium;
        if (large && this.refs.padLarge) this.refs.padLarge.value = large;
    }

    buildFilterQuery() {
        const params = new URLSearchParams();
        const economy = this.refs.economy?.value || 'all';
        const small = this.refs.padSmall?.value || 'any';
        const medium = this.refs.padMedium?.value || 'any';
        const large = this.refs.padLarge?.value || 'any';
        if (economy !== 'all') params.set('economy', economy);
        if (small !== 'any') params.set('small', small);
        if (medium !== 'any') params.set('medium', medium);
        if (large !== 'any') params.set('large', large);
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    }

    updateHashFilters(preserveId) {
        const base = '#/settlement-maps';
        const idSeg = preserveId && this.currentSelectedId ? `/${this.currentSelectedId}` : '';
        const query = this.buildFilterQuery();
        const newHash = `${base}${idSeg}${query}`;
        if (window.location.hash !== newHash) {
            // Replace to avoid cluttering history on every filter change
            window.history.replaceState({}, '', newHash);
        }
    }
}

export const registerSettlementMapsComponent = () => {
    customElements.define('x-settlement-maps', SettlementMaps);
};
