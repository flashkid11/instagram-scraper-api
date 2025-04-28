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
    if (value === null || value === undefined || value === '') return value;
    const stringValue = String(value).trim();
    if (stringValue === '') return value;
    const parsed = parseInt(stringValue, 10);
    return isNaN(parsed) ? value : parsed;
};

// --- Component ---
function ResultsTable({ csvData, jsonData, platform }) {
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    // --- Data and Header Preparation (Keep existing logic) ---
    const { headers: orderedHeaders, data: tableData } = useMemo(() => {
        // ... (Your existing robust data/header logic - no changes needed here) ...
        let explicitHeaders = [];
        let data = [];

        // 1. Try CSV for header order
        if (csvData) {
            try {
                const csvParseResult = Papa.parse(csvData, { header: false, skipEmptyLines: 'greedy', preview: 1 });
                if (csvParseResult.data && csvParseResult.data.length > 0 && csvParseResult.data[0].length > 0) {
                    explicitHeaders = csvParseResult.data[0].map(h => h ? String(h).trim() : '');
                    console.log("Derived explicit header order from CSV:", explicitHeaders);
                } else {
                    console.warn("CSV header row empty or parsing failed for headers.");
                }
            } catch (csvError) {
                 console.error("Error parsing CSV for headers:", csvError);
            }
        }

        // 2. Determine data source (prefer JSON if available)
        if (jsonData && jsonData.length > 0) {
            data = jsonData;
            console.log(`Using ${platform} jsonData (${data.length} rows) for table`);
             if (explicitHeaders.length === 0 && data.length > 0) {
                console.warn("Falling back to platform-specific keys for header order (CSV headers unavailable)");
                 if (platform === 'tiktok') {
                    explicitHeaders = [ // Define a consistent fallback order
                        'authorMeta.avatar', 'authorMeta.name', 'text', 'diggCount', 'shareCount',
                        'playCount', 'commentCount', 'collectCount', 'videoMeta.duration',
                        'musicMeta.musicName', 'webVideoUrl', 'createTimeISO'
                    ];
                    console.log("Using predefined TikTok keys as fallback headers");
                 } else { // Assume Instagram or default
                     // Use specific IG fallback order if needed, otherwise keys from first item
                     explicitHeaders = [
                        'type', 'displayUrl', 'caption', 'likesCount', 'url',
                        'ownerUsername', 'timestamp', 'commentsCount', 'shortCode', 'id'
                        // Add other common keys you might want as fallbacks
                     ].filter(key => key in data[0]); // Only include keys actually present
                     // If still empty, use all keys
                     if (explicitHeaders.length === 0) {
                         explicitHeaders = Object.keys(data[0]);
                     }
                     console.log("Using Instagram fallback/JSON keys from first item as fallback headers:", explicitHeaders);
                 }
             }
        } else if (csvData) {
            // Fallback to parsing full CSV for data
            console.log("Parsing full csvData for table rows (JSON not available)");
            try {
                const fullCsvResult = Papa.parse(csvData, { header: true, skipEmptyLines: 'greedy', transformHeader: header => header ? String(header).trim() : '' });
                if (fullCsvResult.data) {
                    data = fullCsvResult.data.map(row => { // Apply type conversions
                         const newRow = { ...row };
                         const numericKeys = ['commentsCount', 'likesCount', 'ownerId', 'diggCount', 'shareCount', 'playCount', 'commentCount', 'collectCount', 'videoMeta.duration', 'dimensionsHeight', 'dimensionsWidth', 'videoViewCount', 'videoPlayCount'];
                         numericKeys.forEach(key => {
                             if (newRow.hasOwnProperty(key)) newRow[key] = tryParseInt(newRow[key]);
                         });
                         const booleanKeys = ['isSponsored', 'musicMeta.musicOriginal'];
                         booleanKeys.forEach(key => {
                             if (newRow.hasOwnProperty(key)) {
                                 const val = String(newRow[key]).toUpperCase();
                                 if (val === 'TRUE') newRow[key] = true;
                                 else if (val === 'FALSE') newRow[key] = false;
                             }
                         });
                         return newRow;
                     });
                     console.log(`Parsed ${data.length} rows from CSV data.`);
                    if (explicitHeaders.length === 0 && fullCsvResult.meta.fields) {
                         explicitHeaders = fullCsvResult.meta.fields;
                         console.log("Using headers derived from full CSV parse:", explicitHeaders);
                     }
                } else {
                     console.warn("Full CSV parsing returned no data.");
                }
                 if (fullCsvResult.errors && fullCsvResult.errors.length > 0) {
                     console.warn("CSV Parsing Issues for Table Data:", fullCsvResult.errors);
                 }
            } catch (csvError) {
                console.error("Error parsing full CSV for data:", csvError);
                data = [];
            }
        } else {
            console.log("No data (JSON or CSV) provided to ResultsTable");
        }

        if (explicitHeaders.length === 0 && data.length > 0) {
            console.warn("No headers could be determined, attempting fallback from first data row keys.");
            explicitHeaders = Object.keys(data[0]);
        }

        return { headers: explicitHeaders.filter(h => h), data: data };

    }, [csvData, jsonData, platform]);


    // --- Column Definitions (MODIFIED based on platform) ---
    const columns = useMemo(() => {
        console.log(`Regenerating columns for platform: ${platform} using headers:`, orderedHeaders);
        if (!orderedHeaders || orderedHeaders.length === 0) {
            console.log("No headers available to generate columns.");
            return [];
        }

        // ----- TIKTOK COLUMN CONFIG -----
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

            // Map ordered headers (from CSV/fallback) to the desired config
            return orderedHeaders.map(headerKey => {
                const colInfo = tiktokColConfig.find(c => c.key === headerKey) || { key: headerKey, header: headerKey, width: 150 }; // Basic fallback
                return {
                    accessorKey: colInfo.key,
                    header: () => <span>{colInfo.header || headerKey}</span>,
                    size: colInfo.width,
                    enableSorting: colInfo.enableSorting !== false,
                    meta: { // Pass flags to cell renderer via meta
                        isNumeric: colInfo.isNumeric,
                        isImage: colInfo.isImage,
                        isAvatar: colInfo.isAvatar, // Differentiate avatar images
                        isLink: colInfo.isLink,
                        isTruncated: colInfo.isTruncated,
                        isDate: colInfo.isDate,
                    },
                    cell: info => { // Generic cell renderer using meta flags
                        const value = info.getValue();
                        const meta = info.column.columnDef.meta;
                        if (value === null || value === undefined) return <span className="cell-nodata"></span>;

                        if (meta?.isImage && typeof value === 'string' && value.startsWith('http')) {
                             // Use specific class for avatar vs generic image
                            const imgClass = meta.isAvatar ? 'table-avatar' : 'table-image-preview';
                            return <img src={value} alt={colInfo.header} className={imgClass} loading="lazy" onError={(e) => { e.target.style.display='none'; e.target.onerror=null; }} />;
                        }
                        if (meta?.isLink && typeof value === 'string' && value.startsWith('http')) {
                            return <a href={value} target="_blank" rel="noopener noreferrer" title={value}>Link</a>;
                        }
                        if (meta?.isDate) {
                            try { const date = new Date(value); if (!isNaN(date.getTime())) return <span title={date.toISOString()}>{date.toLocaleString()}</span>; } catch (e) { /* Ignore */ }
                        }

                        const stringValue = String(value);
                        const needsTitle = meta?.isTruncated && stringValue.length > 50;
                        return <span className={meta?.isTruncated ? 'truncate' : ''} title={needsTitle ? stringValue : undefined}>{stringValue}</span>;
                    },
                };
            }).filter(col => col.accessorKey); // Ensure we only have valid columns
        }

        // ----- INSTAGRAM COLUMN CONFIG -----
        else if (platform === 'instagram') {
             const instagramColConfig = [
                { key: 'type', header: 'Type', width: 90 },
                { key: 'displayUrl', header: 'Media', isImage: true, width: 100, enableSorting: false }, // Not avatar
                { key: 'caption', header: 'Caption', isTruncated: true, width: 400 }, // More width needed
                { key: 'likesCount', header: 'Likes', isNumeric: true, width: 100 },
                { key: 'commentsCount', header: 'Comments', isNumeric: true, width: 110 },
                { key: 'url', header: 'Post URL', isLink: true, width: 90 },
                { key: 'ownerUsername', header: 'Username', width: 180 },
                { key: 'timestamp', header: 'Timestamp', isDate: true, width: 200 },
                { key: 'shortCode', header: 'Shortcode', width: 120 },
                // Add other desired fields here with their config
                // { key: 'ownerFullName', header: 'Owner Name', width: 180 },
                // { key: 'isSponsored', header: 'Sponsored', isBool: true, width: 100 },
             ];

             // Map the available ordered headers to this config
             return orderedHeaders.map(headerKey => {
                 const colInfo = instagramColConfig.find(c => c.key === headerKey) || { key: headerKey, header: headerKey, width: 150 }; // Basic fallback
                 return {
                     accessorKey: colInfo.key,
                     header: () => { /* Header formatting */
                         const formattedHeader = (colInfo.header || headerKey)
                             .replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')
                             .replace(/^./, str => str.toUpperCase());
                         return <span>{formattedHeader}</span>;
                     },
                     size: colInfo.width,
                     enableSorting: colInfo.enableSorting !== false,
                     meta: { // Pass flags
                         isNumeric: colInfo.isNumeric,
                         isImage: colInfo.isImage,
                         isLink: colInfo.isLink,
                         isTruncated: colInfo.isTruncated,
                         isDate: colInfo.isDate,
                         isBool: colInfo.isBool,
                     },
                     cell: info => { // Generic cell renderer
                        const value = info.getValue();
                        const meta = info.column.columnDef.meta;
                        if (value === null || value === undefined) return <span className="cell-nodata"></span>;

                        if (meta?.isImage && typeof value === 'string' && value.startsWith('http')) {
                            return <img src={value} alt={colInfo.header} className="table-image-preview" loading="lazy" onError={(e) => { e.target.style.display='none'; e.target.onerror=null; }} />;
                        }
                        if (meta?.isLink && typeof value === 'string' && value.startsWith('http')) {
                            return <a href={value} target="_blank" rel="noopener noreferrer" title={value}>Link</a>;
                        }
                        if (meta?.isDate) {
                            try { const date = new Date(value); if (!isNaN(date.getTime())) return <span title={date.toISOString()}>{date.toLocaleString()}</span>; } catch (e) { /* Ignore */ }
                        }
                         if (meta?.isBool) {
                             return typeof value === 'boolean' ? (value ? <span style={{ color: 'green', fontWeight: 'bold' }}>✓ True</span> : <span style={{ color: 'red' }}>✗ False</span>) : <span>{String(value)}</span>;
                         }

                        const stringValue = String(value);
                        const needsTitle = meta?.isTruncated && stringValue.length > 50;
                        return <span className={meta?.isTruncated ? 'truncate' : ''} title={needsTitle ? stringValue : undefined}>{stringValue}</span>;
                     },
                     sortingFn: (rowA, rowB, columnId) => { // Sorting logic
                         const valA = rowA.getValue(columnId);
                         const valB = rowB.getValue(columnId);
                         if (colInfo.isNumeric) { // Use the flag
                             const numA = tryParseInt(valA);
                             const numB = tryParseInt(valB);
                             if (typeof numA === 'number' && typeof numB === 'number') return numA - numB;
                         }
                         return String(valA ?? '').localeCompare(String(valB ?? ''));
                     },
                 };
             }).filter(col => col.accessorKey); // Filter out potential invalid columns if headers don't match perfectly
        }
        // Fallback for any other platform (or if platform prop is missing)
        else {
             console.warn(`No specific column configuration for platform: ${platform}. Using generic approach.`);
             return orderedHeaders.map(headerKey => ({
                 accessorKey: headerKey,
                 header: () => <span>{headerKey}</span>, // Basic header
                 cell: info => <span>{String(info.getValue() ?? '')}</span>, // Basic cell
                 enableSorting: true,
                 size: 150, // Default size
             }));
        }

    }, [platform, orderedHeaders, tableData]); // Regenerate when these change


    // --- Table Instance (no changes needed) ---
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
        // debugTable: true,
    });

    // --- Render Logic ---
    if (!columns || columns.length === 0) {
         return (
             <div className="results-container">
                 <p>Table columns could not be generated. Check data or configuration.</p>
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
                                {globalFilter ? `No results match your filter "${globalFilter}".` : (tableData.length > 0 ? 'Processing resulted in empty view.' : 'No data available.')}
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