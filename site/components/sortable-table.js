class SortableTableComponent extends HTMLElement {
    constructor() {
        super();
        this.headers = [];
        this.rows = [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.innerHTML = `
            <div class="sortable-table-container">
                <table class="sortable-table">
                    <thead></thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
        this.tableElement = this.querySelector('.sortable-table');
        this.thead = this.querySelector('thead');
        this.tbody = this.querySelector('tbody');
    }

    connectedCallback() {
        // Event delegation for header clicks
        this.thead.addEventListener('click', (e) => this.onHeaderClick(e));
    }

    disconnectedCallback() {
        // Cleanup if needed
    }

    setHeaders(headers) {
        this.headers = headers; // Array of {key, label, sortable} objects
        this.renderHeaders();
    }

    addRow(data) {
        this.rows.push(data);
        this.renderBody();
    }

    clearRows() {
        this.rows = [];
        this.renderBody();
    }

    setRows(rows) {
        this.rows = rows;
        this.renderBody();
    }

    sort(column, direction = 'asc') {
        this.sortColumn = column;
        this.sortDirection = direction;

        this.rows.sort((a, b) => {
            const valueA = a[column];
            const valueB = b[column];

            if (typeof valueA === 'string') {
                return direction === 'asc'
                    ? valueA.localeCompare(valueB || '')
                    : (valueB || '').localeCompare(valueA);
            } else if (typeof valueA === 'number' || valueA instanceof Date) {
                return direction === 'asc' ? valueA - valueB : valueB - valueA;
            }
            return 0;
        });

        this.renderBody();
        this.renderHeaders(); // Update sort indicators
    }

    onHeaderClick(e) {
        const header = e.target.closest('th[data-column]');
        if (!header) return;

        const column = header.getAttribute('data-column');
        const currentDirection = header.getAttribute('data-direction') || 'asc';
        const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

        this.sort(column, newDirection);
    }

    renderHeaders() {
        const headerHTML = this.headers.map(header => {
            if (!header.sortable) {
                return `<th>${header.label}</th>`;
            }

            const isSorted = this.sortColumn === header.key;
            const sortIcon = isSorted ? (this.sortDirection === 'asc' ? '▲' : '▼') : '';
            
            return `
                <th data-column="${header.key}" data-direction="${isSorted ? this.sortDirection : ''}" class="sortable">
                    ${header.label} ${sortIcon}
                </th>
            `;
        }).join('');

        this.thead.innerHTML = `<tr>${headerHTML}</tr>`;
    }

    renderBody() {
        const rowsHTML = this.rows.map(row => {
            const cellsHTML = this.headers.map(header => {
                const value = row[header.key];
                return `<td>${value || ''}</td>`;
            }).join('');
            return `<tr>${cellsHTML}</tr>`;
        }).join('');

        this.tbody.innerHTML = rowsHTML;
    }

    // Method to get the current HTML (for compatibility with existing code)
    getHTML() {
        return this.innerHTML;
    }

    // Legacy method for compatibility - not needed with Web Component approach
    attachSortListeners(container) {
        // This is handled by the connectedCallback event listener
        // Kept for compatibility but does nothing
    }
}

export function registerSortableTableComponent() {
    customElements.define('x-sortable-table', SortableTableComponent);
}