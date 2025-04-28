// src/components/ResultsTable.js
import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
} from '@tanstack/react-table';
import './ResultsTable.css'; // Ensure CSS is imported

// --- Helper Functions ---
const tryParseInt = (value) => {
    // Safely parses integers, returning original value if not parsable.
    if (value === null || value === undefined || value === '') return value;
    const stringValue = String(value).trim();
    if (stringValue === '') return value;
    const parsed = parseInt(stringValue, 10);
    return isNaN(parsed) ? value : parsed;
};

const formatHeader = (key) => {
    // Formats keys like 'ownerUsername' or 'displayUrl' into 'Owner Username' or 'Display URL'.
    if (!key) return '';
    return String(key)
        .replace(/([A-Z])/g, ' $1') // Add space before caps
        .replace(/[._]/g, ' ')      // Replace underscores or dots with space
        .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize first letter of each word
        .replace('Url', ' URL') // Specific formatting for 'Url'
        .replace('Id', ' ID')   // Specific formatting for 'Id'
        .trim();
};


// --- Component ---
function ResultsTable({ csvData, jsonData, platform }) {
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    // --- Data and Header Preparation ---
    // Determines the data array and the ordered list of headers to use.
    const { headers: orderedHeaders, data: tableData } = useMemo(() => {
        let explicitHeaders = [];
        let data = [];

        // 1. Try to get header order from CSV first (most reliable source for order)
        if (csvData) {
            try {
                const csvParseResult = Papa.parse(csvData, { header: false, skipEmptyLines: 'greedy', preview: 1 });
                if (csvParseResult.data && csvParseResult.data.length > 0 && csvParseResult.data[0].length > 0) {
                    // Use headers from the first row of CSV
                    explicitHeaders = csvParseResult.data[0].map(h => h ? String(h).trim() : '');
                    console.log("Derived explicit header order from CSV:", explicitHeaders);
                } else { console.warn("CSV header row empty or parsing failed for headers."); }
            } catch (csvError) { console.error("Error parsing CSV for headers:", csvError); }
        }

        // 2. Determine data source (prefer JSON for richer data types)
        if (jsonData && jsonData.length > 0) {
            data = jsonData; // Use JSON array as the primary data source
            console.log(`Using ${platform} jsonData (${data.length} rows) for table`);
             // If headers weren't derived from CSV, try getting them from JSON keys
             if (explicitHeaders.length === 0 && data.length > 0 && data[0]) {
                console.warn("Deriving headers from JSON keys (order not guaranteed)");
                // Get all unique keys from all JSON objects
                const allKeys = new Set();
                data.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
                explicitHeaders = Array.from(allKeys);
                // Ensure 'displayUrl' is included if present in data, as it's often important
                if (data[0].hasOwnProperty('displayUrl') && !explicitHeaders.includes('displayUrl')) {
                    // Attempt to insert it after 'type' or near the beginning if possible
                    const typeIndex = explicitHeaders.indexOf('type');
                    if (typeIndex !== -1) {
                         explicitHeaders.splice(typeIndex + 1, 0, 'displayUrl');
                    } else {
                         explicitHeaders.unshift('displayUrl'); // Add to beginning if type not found
                    }
                    console.log("Ensured 'displayUrl' is included in headers derived from JSON keys.")
                }
             }
        } else if (csvData) {
            // Fallback to parsing full CSV for data if JSON is missing
            console.log("Parsing full csvData for table rows (JSON not available)");
            try {
                const fullCsvResult = Papa.parse(csvData, { header: true, skipEmptyLines: 'greedy', transformHeader: header => header ? String(header).trim() : '' });
                if (fullCsvResult.data) {
                    data = fullCsvResult.data.map(row => { // Apply type conversions
                         const newRow = { ...row };
                         // Define keys to attempt parsing as numbers
                         const numericKeys = ['commentsCount', 'likesCount', 'ownerId', 'diggCount', 'shareCount', 'playCount', 'commentCount', 'collectCount', 'videoMeta.duration', 'dimensionsHeight', 'dimensionsWidth', 'videoViewCount', 'videoPlayCount'];
                         numericKeys.forEach(key => { if (newRow.hasOwnProperty(key)) newRow[key] = tryParseInt(newRow[key]); });
                         // Define keys to attempt parsing as booleans
                         const booleanKeys = ['isSponsored', 'musicMeta.musicOriginal'];
                         booleanKeys.forEach(key => { if (newRow.hasOwnProperty(key)) { const val = String(newRow[key]).toUpperCase(); if (val === 'TRUE') newRow[key] = true; else if (val === 'FALSE') newRow[key] = false; } });
                         return newRow;
                     });
                     console.log(`Parsed ${data.length} rows from CSV data.`);
                    // If headers still missing, use headers from the CSV parse meta
                    if (explicitHeaders.length === 0 && fullCsvResult.meta.fields) {
                         explicitHeaders = fullCsvResult.meta.fields;
                         console.log("Using headers derived from full CSV parse:", explicitHeaders);
                     }
                     // Ensure 'displayUrl' from CSV parse if missed
                     if (fullCsvResult.meta.fields && fullCsvResult.meta.fields.includes('displayUrl') && !explicitHeaders.includes('displayUrl')){
                         explicitHeaders.push('displayUrl');
                     }
                } else { console.warn("Full CSV parsing returned no data."); }
                 if (fullCsvResult.errors && fullCsvResult.errors.length > 0) console.warn("CSV Parsing Issues for Table Data:", fullCsvResult.errors);
            } catch (csvError) { console.error("Error parsing full CSV for data:", csvError); data = []; }
        } else { console.log("No data (JSON or CSV) provided to ResultsTable"); }

        // Final fallback if headers are still missing
        if (explicitHeaders.length === 0 && data.length > 0 && data[0]) {
            console.warn("No headers could be determined, attempting fallback from first data row keys.");
            explicitHeaders = Object.keys(data[0]);
        }
        // Ensure headers are unique and non-empty
        explicitHeaders = [...new Set(explicitHeaders.filter(h => h))];

        return { headers: explicitHeaders, data: data };

    }, [csvData, jsonData, platform]);


    // --- Column Definitions ---
    // Creates the column configuration array based on the platform and derived headers.
    const columns = useMemo(() => {
        console.log(`Regenerating columns for platform: ${platform}`);

        // ----- TIKTOK COLUMN CONFIG (Specific structure) -----
        if (platform === 'tiktok') {
            const tiktokColConfig = [
                { key: 'authorMeta.avatar', header: "Avatar", isImage: true, isAvatar: true, width: 70, enableSorting: false },
                { key: 'authorMeta.name', header: 'Author', width: 180 },
                { key: 'text', header: 'Text', isTruncated: true, width: 350 },
                { key: 'diggCount', header: 'Diggs', isNumeric: true, width: 100 },
                { key: 'shareCount', header: 'Shares', isNumeric: true, width: 100 },
                { key: 'playCount', header: 'Plays', isNumeric: true, width: 110 },
                { key: 'commentCount', header: 'Comments', isNumeric: true, width: 110 },
                { key: 'collectCount', header: 'Bookmarks', isNumeric: true, width: 110 },
                { key: 'videoMeta.duration', header: 'Duration', isNumeric: true, width: 100 },
                { key: 'musicMeta.musicName', header: 'Music', width: 200 },
                { key: 'webVideoUrl', header: 'Video URL', isLink: true, width: 90 },
                { key: 'createTimeISO', header: 'Timestamp', isDate: true, width: 200 },
            ];
            // Iterate directly over the config to create columns
            return tiktokColConfig.map(colInfo => ({
                accessorKey: colInfo.key,
                header: () => <span>{colInfo.header}</span>,
                size: colInfo.width,
                enableSorting: colInfo.enableSorting !== false,
                meta: { isNumeric: colInfo.isNumeric, isImage: colInfo.isImage, isAvatar: colInfo.isAvatar, isLink: colInfo.isLink, isTruncated: colInfo.isTruncated, isDate: colInfo.isDate },
                cell: info => { /* Generic cell renderer for TikTok */
                    const value = info.getValue(); const meta = info.column.columnDef.meta;
                    if (value === null || value === undefined) return <span className="cell-nodata"></span>;
                    if (meta?.isImage) { const imgClass = meta.isAvatar ? 'table-avatar' : 'table-image-preview'; return <img src={value} alt={colInfo.header} className={imgClass} loading="lazy" onError={(e) => { e.target.style.display='none'; e.target.onerror=null; }} />; }
                    if (meta?.isLink) { return <a href={value} target="_blank" rel="noopener noreferrer" title={value}>Link</a>; }
                    if (meta?.isDate) { try { const date = new Date(value); if (!isNaN(date.getTime())) return <span title={date.toISOString()}>{date.toLocaleString()}</span>; } catch (e) {} return <span>{String(value)}</span>; }
                    const stringValue = String(value); const needsTitle = meta?.isTruncated && stringValue.length > 50;
                    return <span className={meta?.isTruncated ? 'truncate' : ''} title={needsTitle ? stringValue : undefined}>{stringValue}</span>;
                },
             }));
        }

        // ----- DYNAMIC COLUMNS FOR INSTAGRAM (and others) -----
        // Generates columns based on the available headers, inferring types.
        else {
            if (!orderedHeaders || orderedHeaders.length === 0) {
                console.error(`Cannot generate columns for ${platform}: No headers derived.`);
                return []; // Important: return empty array if no headers
            }
            console.log(`Generating dynamic columns for ${platform} based on headers:`, orderedHeaders);

            return orderedHeaders.map(headerKey => {
                 // Infer column properties based on the header key
                 const lowerHeader = headerKey.toLowerCase();
                 const isNumeric = /count|id$|width|height|duration|playcount|viewcount/i.test(headerKey) && !lowerHeader.includes('url') && lowerHeader !== 'ownerid'; // Refined numeric check
                 const isImage = false; // ** Treat displayUrl as link by default **
                 const isAvatar = lowerHeader.includes('avatar'); // Still useful if avatars appear elsewhere
                 const isLink = lowerHeader.includes('url'); // Catch displayUrl, inputUrl, url, etc.
                 const isDate = lowerHeader.includes('timestamp') || lowerHeader.includes('date');
                 const isBool = lowerHeader.startsWith('is');
                 // Define which keys represent arrays that should be specially handled
                 const isArray = ['hashtags', 'mentions', 'latestcomments', 'childposts', 'images'].includes(lowerHeader);
                 // Define which text columns should get the truncate class (and title on hover)
                 const isTruncated = ['caption', 'text', 'alt', 'firstcomment'].includes(lowerHeader) || isArray; // Truncate long text and array summaries

                 // Determine Width based on inferred type
                 let width = 160; // Default
                 if (isAvatar) width = 70;
                 else if (isLink) width = 90; // Base width for links
                 else if (isNumeric || isBool || /type/i.test(headerKey)) width = 100; // Adjusted width
                 else if (isDate) width = 200;
                 else if (lowerHeader.includes('username') || lowerHeader.includes('name')) width = 180;
                 else if (lowerHeader === 'caption' || lowerHeader === 'alt') width = 400; // Wider text fields
                 else if (lowerHeader === 'shortcode') width = 130;
                 else if (lowerHeader === 'id') width = 180; // Wider ID
                 else if (isArray) width = 200; // Width for array summaries
                 // Specific width override for displayUrl link
                 if (lowerHeader === 'displayurl') width = 250;


                 return {
                     accessorKey: headerKey,
                     header: () => <span>{formatHeader(headerKey)}</span>,
                     size: width,
                     enableSorting: true, // Allow sorting on all dynamic columns initially
                     meta: { isNumeric, isImage, isAvatar, isLink, isTruncated, isDate, isBool, isArray }, // Pass flags
                     cell: info => { // Cell renderer using inferred flags
                        const value = info.getValue();
                        const meta = info.column.columnDef.meta;
                        if (value === null || value === undefined) return <span className="cell-nodata"></span>;

                        // Handle Arrays
                        if (meta?.isArray) {
                            if (Array.isArray(value)) {
                                const displayString = value.slice(0, 5).join(', ') + (value.length > 5 ? '...' : '');
                                const fullString = JSON.stringify(value); // Tooltip shows full array
                                return <span title={fullString} className="truncate">{value.length > 0 ? displayString : '[]'}</span>;
                            } else {
                                // Show non-array value as string if isArray flag is wrongly set
                                return <span className="truncate" title={String(value)}>{String(value)}</span>
                            }
                        }
                        // Handle other Objects
                        if (!meta?.isArray && typeof value === 'object' && value !== null) {
                             return <span title={JSON.stringify(value)} className="truncate">{'{...}'}</span>;
                        }

                        // **** Render LINKS (including displayUrl) ****
                        if (meta?.isLink && typeof value === 'string' && value.startsWith('http')) {
                            const linkText = lowerHeader === 'displayurl' ? 'Media Link' : 'Link'; // Specific text for displayUrl
                            return <a href={value} target="_blank" rel="noopener noreferrer" title={value}>{linkText}</a>;
                        }

                        // Render Images (only if isImage flag happens to be true for a non-URL column)
                        if (meta?.isImage && typeof value === 'string' && value.startsWith('http')) {
                             const imgClass = meta.isAvatar ? 'table-avatar' : 'table-image-preview';
                             return <img src={value} alt={formatHeader(headerKey)} className={imgClass} loading="lazy" onError={(e) => { e.target.style.display='none'; e.target.onerror=null; }} />;
                        }
                        // Render Dates
                         if (meta?.isDate) {
                            try { const date = new Date(value); if (!isNaN(date.getTime())) return <span title={date.toISOString()}>{date.toLocaleString()}</span>; } catch (e) { /* Ignore parsing error */ }
                            return <span>{String(value)}</span>; // Fallback to string
                         }
                         // Render Booleans
                         if (meta?.isBool) {
                             const boolVal = String(value).toLowerCase();
                             if (boolVal === 'true') return <span style={{ color: 'green', fontWeight: 'bold' }}>✓ True</span>;
                             if (boolVal === 'false') return <span style={{ color: 'red' }}>✗ False</span>;
                             return <span>{String(value)}</span>; // Fallback
                         }

                        // Default: Render as string, apply truncate class + title *only if* isTruncated flag is true
                        const stringValue = String(value);
                        const tooltip = meta?.isTruncated ? stringValue : undefined; // Tooltip only for truncated columns
                        return <span className={meta?.isTruncated ? 'truncate' : ''} title={tooltip}>{stringValue}</span>;
                     },
                     sortingFn: (rowA, rowB, columnId) => { // Sorting logic
                         const valA = rowA.getValue(columnId); const valB = rowB.getValue(columnId);
                         if (isNumeric) { const numA = tryParseInt(valA); const numB = tryParseInt(valB); if (typeof numA === 'number' && typeof numB === 'number') return numA - numB; }
                         if (isArray) { return String(valA).localeCompare(String(valB));} // Sort arrays as strings
                         return String(valA ?? '').localeCompare(String(valB ?? ''));
                     },
                 };
             });
        }

    // Depend on platform and the derived headers for the dynamic/fallback case
    }, [platform, orderedHeaders]);


    // --- Table Instance ---
    const table = useReactTable({
        data: tableData ?? [],
        columns,
        state: { sorting, globalFilter, pagination },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // --- Render Logic ---
    if (!columns || columns.length === 0) {
         return (
            <div className="results-container">
                { !tableData || tableData.length === 0 ? (
                    <p style={{textAlign: 'center', fontStyle: 'italic', marginTop: '20px'}}>No data available to display.</p>
                ) : (
                    <p style={{textAlign: 'center', fontStyle: 'italic', marginTop: '20px'}}>Could not determine table structure from the provided data.</p>
                )}
            </div>
         );
    }

    return (
        <div className="results-container">
            {/* Controls Header */}
            <div className="table-controls-header">
                 <h2>Scraped Results ({table.getFilteredRowModel().rows.length} / {tableData.length} rows for {platform})</h2>
                 <div className="filter-container">
                    <label htmlFor="table-filter-input">Search Table:</label>
                    <input id="table-filter-input" type="text" value={globalFilter ?? ''} onChange={e => setGlobalFilter(e.target.value)} className="filter-input" placeholder={`Filter ${tableData.length} records...`} />
                </div>
            </div>

            {/* Table Wrapper */}
            <div className="table-wrapper">
                <table>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                <th className="index-column">#</th>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id}
                                        colSpan={header.colSpan}
                                        className={`${header.column.getCanSort() ? 'sortable' : ''} ${header.column.getIsSorted() ? 'sorted-' + header.column.getIsSorted() : ''} ${header.column.columnDef.meta?.isNumeric ? 'numeric-header' : ''}`}
                                        style={{ width: header.getSize() }}
                                        onClick={header.column.getToggleSortingHandler()}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        <span className="sort-icon">
                                            {{ asc: '▲', desc: '▼', }[header.column.getIsSorted()] ?? null}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row, index) => (
                            <tr key={row.id}>
                                <td className="index-column">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + index + 1}</td>
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id}
                                        style={{ width: cell.column.getSize() }}
                                        className={`
                                            ${cell.column.columnDef.meta?.isNumeric ? 'numeric-cell' : ''}
                                            ${cell.column.columnDef.meta?.isImage || cell.column.columnDef.meta?.isLink ? 'center-cell' : ''}
                                        `}
                                        >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {table.getRowModel().rows.length === 0 && (
                            <tr><td colSpan={(columns?.length ?? 0) + 1} className="no-results-row">
                                {globalFilter ? `No results match your filter "${globalFilter}".` : 'No data available.'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

             {/* Pagination Controls */}
             <div className="pagination-controls">
                 <button className="page-button" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label="Go to first page">{'<< First'}</button>
                 <button className="page-button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Go to previous page">{'< Prev'}</button>
                 <span className="page-info">Page{' '}<strong>{table.getState().pagination.pageIndex + 1} of {table.getPageCount() > 0 ? table.getPageCount() : 1}</strong>{' '}</span>
                 <button className="page-button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Go to next page">{'Next >'}</button>
                 <button className="page-button" onClick={() => table.setPageIndex(Math.max(0, table.getPageCount() - 1))} disabled={!table.getCanNextPage()} aria-label="Go to last page">{'Last >>'}</button>
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