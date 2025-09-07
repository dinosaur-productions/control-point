/**
 * Simple sortable table utility
 */
export class SortableTable {
    constructor(headers) {
        this.headers = headers; // Array of {key, label, sortable} objects
        this.rows = [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
    }

    addRow(data) {
        this.rows.push(data);
    }

    clearRows() {
        this.rows = [];
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
    }

    getHTML() {
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

        const rowsHTML = this.rows.map(row => {
            const cellsHTML = this.headers.map(header => {
                const value = row[header.key];
                return `<td>${value || ''}</td>`;
            }).join('');
            return `<tr>${cellsHTML}</tr>`;
        }).join('');

        return `
            <table class="sortable-table">
                <thead>
                    <tr>${headerHTML}</tr>
                </thead>
                <tbody>
                    ${rowsHTML}
                </tbody>
            </table>
        `;
    }

    attachSortListeners(container) {
        container.querySelectorAll('th[data-column]').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-column');
                const currentDirection = header.getAttribute('data-direction') || 'asc';
                const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

                this.sort(column, newDirection);
                
                // Re-render the table
                container.innerHTML = this.getHTML();
                this.attachSortListeners(container);
            });
        });
    }
}
