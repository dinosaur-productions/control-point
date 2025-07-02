class AutoCompleteComponent extends HTMLElement {
    constructor() {
        super();
        const placeholder = this.getAttribute('placeholder');
        this.innerHTML = `
        <div class="autocomplete-root">
            <input type="text" class="autocomplete-input" autocomplete="off" placeholder="${placeholder}" />
            <ul class="autocomplete-list"></ul>
        </div>
        `;
        this.input = this.querySelector('.autocomplete-input');
        this.list = this.querySelector('.autocomplete-list');
        this.items = [];
        this.selectedIndex = -1;
        this.loading = false;
        this.onSelect = null; // callback

        // Bind the handler so it can be removed later
        this._onDocumentClick = this._onDocumentClick.bind(this);
    }

    static get observedAttributes() {
        return ['placeholder'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'placeholder' && this.input) {
            this.input.placeholder = newValue;
        }
    }

    connectedCallback() {
        this.input.addEventListener('input', (e) => this.onInput(e));
        this.input.addEventListener('keydown', (e) => this.onKeyDown(e));
        this.list.addEventListener('mousedown', (e) => this.onListMouseDown(e));
        document.addEventListener('mousedown', this._onDocumentClick);
    }

    disconnectedCallback() {
        document.removeEventListener('mousedown', this._onDocumentClick);
    }

    _onDocumentClick(e) {
        // If the click is outside this component, close the list
        const path = e.composedPath ? e.composedPath() : [];
        if (!path.includes(this)) {
            this.setOptions([]);
        }
    }

    setLoading(loading) {
        this.loading = loading;
        this.input.disabled = loading;
        if (loading) {
            this.input.placeholder = 'Loading database...';
        } else {
            this.input.placeholder = this.getAttribute('placeholder');
        }
    }

    setOptions(options) {
        this.items = options || [];
        this.selectedIndex = -1;
        this.renderList();
    }

    onInput(e) {
        const value = this.input.value;
        this.dispatchEvent(new CustomEvent('search', { detail: value }));
    }

    onKeyDown(e) {
        if (!this.items.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
            this.renderList();
            this.scrollSelectedIntoView();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
            this.renderList();
            this.scrollSelectedIntoView();
        } else if (e.key === 'Enter') {
            if (this.selectedIndex >= 0 && this.selectedIndex < this.items.length) {
                this.selectItem(this.items[this.selectedIndex]);
            }
        }
    }

    onListMouseDown(e) {
        const li = e.target.closest('li');
        if (!li) return;
        const idx = parseInt(li.getAttribute('data-index'), 10);
        if (!isNaN(idx)) {
            this.selectItem(this.items[idx]);
        }
    }

    selectItem(item) {
        this.input.value = item.StarSystem;
        this.setOptions([]);
        this.dispatchEvent(new CustomEvent('select', { detail: item }));
    }

    renderList() {
        this.list.innerHTML = '';
        if (!this.items.length) return;
        for (let i = 0; i < this.items.length; ++i) {
            const item = this.items[i];
            const li = document.createElement('li');
            li.textContent = item.StarSystem;
            li.setAttribute('data-index', i);
            if (i === this.selectedIndex) {
                li.classList.add('selected');
            }
            // Add mouseover to clear keyboard highlight
            li.addEventListener('mouseenter', () => {
                this.selectedIndex = -1;
                // Remove highlight from all items
                Array.from(this.list.children).forEach(el => el.classList.remove('selected'));
            });
            this.list.appendChild(li);
        }
    }

    scrollSelectedIntoView() {
        const selected = this.list.querySelector('.selected');
        if (selected) selected.scrollIntoView({ block: 'nearest' });
    }

    get value() {
        return this.input.value;
    }
    set value(val) {
        this.input.value = val;
    }
}

export function registerAutoCompleteComponent() {
    customElements.define('x-autocomplete', AutoCompleteComponent);
}
