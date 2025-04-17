// src/components/ResultsTable.js
import React, { useState, useMemo } from 'react'; // Removed useEffect again if not needed
import Papa from 'papaparse';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
} from '@tanstack/react-table';
import './ResultsTable.css';

// Helper to try parsing numeric values for sorting (keep this)
const tryParseInt = (value) => {
    if (value === null || value === undefined || value === '') return value;
    const stringValue = String(value).trim();
    if (stringValue === '') return value;
    const parsed = parseInt(stringValue, 10);
    return isNaN(parsed) ? value : parsed;
};

function ResultsTable({ csvData, jsonData }) {
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0, //initial page index
        pageSize: 10, //initial page size
    });

    // --- Data and Header Preparation (Prioritize CSV Order for Headers) ---
    const { headers: orderedHeaders, data: tableData } = useMemo(() => {
        let explicitHeaders = [];
        let data = [];

        // 1. Try parsing CSV first to get the GUARANTEED header order
        if (csvData) {
            const csvParseResult = Papa.parse(csvData, {
                header: false, // Parse headers separately to ensure order
                skipEmptyLines: 'greedy',
                preview: 1 // Only need the first row for headers
            });

            if (csvParseResult.data && csvParseResult.data.length > 0) {
                // Trim whitespace from headers obtained from CSV
                explicitHeaders = csvParseResult.data[0].map(h => h.trim());
                console.log("Derived explicit header order from CSV:", explicitHeaders);
            } else {
                 console.warn("Could not derive header order from CSV data.");
            }
        }

        // 2. Determine the data source (prefer JSON for types if available)
        if (jsonData && jsonData.length > 0) {
            data = jsonData; // Use JSON data for better type handling
            console.log("Using jsonData for table rows");
             // If we couldn't get headers from CSV, fallback to JSON keys (order not guaranteed)
             if (explicitHeaders.length === 0 && data.length > 0) {
                console.warn("Falling back to JSON keys for header order (order not guaranteed)");
                 const allKeys = new Set();
                 data.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
                 explicitHeaders = Array.from(allKeys);
             }
        } else if (csvData) {
            // Fallback to parsing full CSV for data if JSON is unavailable
            console.log("Parsing full csvData for table rows (JSON not available)");
            const fullCsvResult = Papa.parse(csvData, {
                 header: true, // Now parse with headers true for data objects
                 skipEmptyLines: 'greedy',
                 transformHeader: header => header.trim(),
            });
             data = fullCsvResult.data.map(row => { // Apply type conversions like before
                 const newRow = { ...row };
                 ['commentsCount', 'likesCount', 'ownerId'].forEach(key => {
                     if (newRow.hasOwnProperty(key)) newRow[key] = tryParseInt(newRow[key]);
                 });
                 ['isSponsored'].forEach(key => {
                     if (newRow.hasOwnProperty(key) && typeof newRow[key] === 'string') {
                         if (newRow[key].toUpperCase() === 'TRUE') newRow[key] = true;
                         else if (newRow[key].toUpperCase() === 'FALSE') newRow[key] = false;
                     }
                 });
                 return newRow;
             });
            if (fullCsvResult.errors && fullCsvResult.errors.length > 0) {
                 console.warn("CSV Parsing Issues for Table Data:", fullCsvResult.errors);
            }
             // Ensure headers derived from CSV are used if not already set
             if (explicitHeaders.length === 0 && fullCsvResult.meta.fields) {
                 explicitHeaders = fullCsvResult.meta.fields;
                 console.log("Using headers from full CSV parse:", explicitHeaders);
             }

        } else {
            console.log("No data (JSON or CSV) provided to ResultsTable");
        }

        // Return the explicitly ordered headers and the determined data
        return { headers: explicitHeaders, data: data };

    }, [csvData, jsonData]); // Re-run when either data source changes


     // --- Column Definitions (Now uses the orderedHeaders) ---
     const columns = useMemo(() => {
        if (!orderedHeaders || orderedHeaders.length === 0) return [];
        console.log("Regenerating columns based on ordered headers:", orderedHeaders);

        // Iterate through the ORDERED headers derived primarily from the CSV
        return orderedHeaders.map(headerKey => ({
            accessorKey: headerKey, // Use the header string as the accessor key
            // Header: Format the header text for display
            header: () => {
                 const formattedHeader = headerKey
                    .replace(/([A-Z])/g, ' $1') // Add space before caps
                    .replace(/_/g, ' ')       // Replace underscores with space
                    .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
                 return <span>{formattedHeader}</span>;
            },
            // Cell rendering logic (remains the same as before)
            cell: info => {
                let value = info.getValue();
                if (value === null || value === undefined) return <span style={{ color: '#aaa' }}></span>;
                if ((headerKey === 'url' || headerKey === 'displayUrl' || headerKey === 'inputUrl') && typeof value === 'string' && value.startsWith('http')) {
                    return <a href={value} target="_blank" rel="noopener noreferrer" title={value}>{value.length > 40 ? value.substring(0, 40) + '...' : value}</a>;
                }
                if (typeof value === 'boolean') return value ? <span style={{ color: 'green', fontWeight: 'bold' }}>✓ True</span> : <span style={{ color: 'red' }}>✗ False</span>;
                if (headerKey.toLowerCase().includes('timestamp') || headerKey.toLowerCase().includes('date')) {
                    try { const date = new Date(value); if (!isNaN(date.getTime())) return <span title={date.toISOString()}>{date.toLocaleString()}</span>; } catch (e) { /* Ignore */ }
                }
                const stringValue = String(value);
                return <span title={stringValue.length > 100 ? stringValue : undefined}>{stringValue.length > 100 ? stringValue.substring(0, 100) + '...' : stringValue}</span>;
            },
             // Sorting enablement (remains the same logic)
             enableSorting: ['commentsCount', 'likesCount', 'timestamp', 'ownerUsername', 'type', 'id', 'isSponsored'].includes(headerKey) || typeof tableData[0]?.[headerKey] === 'number',
             sortingFn: typeof tableData[0]?.[headerKey] === 'number' ? 'alphanumeric' : 'auto',
        }));
    }, [orderedHeaders, tableData]); // Depend on the explicitly ordered headers and the data


    // --- Table Instance (remains the same) ---
    const table = useReactTable({
        data: tableData, // Use the processed tableData
        columns,         // Use the ordered columns
        state: { sorting, globalFilter, pagination },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        // debugTable: true,
    });

    // --- Render Logic (remains largely the same) ---
    if (tableData.length === 0) {
         return null;
    }

    return (
        <div className="results-container">
            {/* Controls Header (remains the same) */}
            <div className="table-controls-header">
                 <h2>Scraped Results ({table.getFilteredRowModel().rows.length} / {tableData.length} rows)</h2>
                <div className="filter-container">
                    <label htmlFor="table-filter-input">Search Table:</label>
                    <input id="table-filter-input" type="text" value={globalFilter ?? ''} onChange={e => setGlobalFilter(e.target.value)} className="filter-input" placeholder={`Filter ${tableData.length} records...`} />
                </div>
            </div>

            {/* Table Wrapper (remains the same) */}
            <div className="table-wrapper">
                <table>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} colSpan={header.colSpan} className={`${header.column.getCanSort() ? 'sortable' : ''} ${header.column.getIsSorted() ? 'sorted-' + header.column.getIsSorted() : ''}`} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }} onClick={header.column.getToggleSortingHandler()}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        {{ asc: <span className="sort-icon"> ▲</span>, desc: <span className="sort-icon"> ▼</span>, }[header.column.getIsSorted()] ?? null}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} data-label={cell.column.id} style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {table.getRowModel().rows.length === 0 && globalFilter && (
                            <tr><td colSpan={columns.length} style={{ textAlign: 'center', fontStyle: 'italic', padding: '20px' }}>No results match your filter "{globalFilter}".</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

             {/* Pagination Controls (remains the same) */}
             <div className="pagination-controls">
                 <button className="page-button" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label="Go to first page">{'<< First'}</button>
                 <button className="page-button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Go to previous page">{'< Prev'}</button>
                 <span className="page-info">Page{' '}<strong>{table.getState().pagination.pageIndex + 1} of {table.getPageCount() > 0 ? table.getPageCount() : 1}</strong>{' '}</span>
                 <button className="page-button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Go to next page">{'Next >'}</button>
                 <button className="page-button" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} aria-label="Go to last page">{'Last >>'}</button>
                 <span className="page-size-controls">| Go to page:
                     <input type="number" className="page-input" defaultValue={table.getState().pagination.pageIndex + 1} onChange={e => { const page = e.target.value ? Number(e.target.value) - 1 : 0; const safePage = Math.max(0, Math.min(page, table.getPageCount() - 1)); if (!isNaN(safePage)) table.setPageIndex(safePage); }} min="1" max={table.getPageCount() > 0 ? table.getPageCount() : 1} aria-label="Page number input"/>
                 </span>
                 <select className="page-size-select" value={table.getState().pagination.pageSize} onChange={e => { table.setPageSize(Number(e.target.value)); }} aria-label="Select page size">
                     {[10, 25, 50, 100].map(pageSize => (<option key={pageSize} value={pageSize}>Show {pageSize}</option>))}
                 </select>
             </div>
        </div>
    );
}

export default ResultsTable;