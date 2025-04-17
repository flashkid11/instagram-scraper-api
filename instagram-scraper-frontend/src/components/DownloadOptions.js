// src/components/DownloadOptions.js
import React, { useMemo } from 'react'; // <-- Add useMemo here
import './DownloadOptions.css';

function DownloadOptions({ csvData, jsonData, csvFilename, jsonFilename }) {

  const handleDownload = (data, filename, mimeType) => {
    if (!data || !filename) return;

    // Create a Blob from the data
    const blob = new Blob([data], { type: mimeType });

    // Create a link element
    const link = document.createElement('a');
    if (link.download !== undefined) { // Check for browser support
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Free up memory
    } else {
      alert("Your browser doesn't support direct downloads. Please try another browser.");
    }
  };

  const handleCsvDownload = () => {
    handleDownload(csvData, csvFilename, 'text/csv;charset=utf-8;');
  };

   // Prepare JSON data (pretty-printed)
   const jsonString = useMemo(() => { // Now useMemo is defined
      if (!jsonData || jsonData.length === 0) return null;
      try {
          // null, 2 for pretty printing (indentation)
          return JSON.stringify(jsonData, null, 2);
      } catch (e) {
          console.error("Error stringifying JSON data:", e);
          return null; // Handle potential circular references or other errors
      }
   }, [jsonData]); // Dependency array


  const handleJsonDownload = () => {
    if (!jsonString) return;
    handleDownload(jsonString, jsonFilename, 'application/json;charset=utf-8;');
  };

  // Only render the container if there's something to download
  if (!csvData && !jsonString) {
    return null;
  }

  return (
    <div className="download-options-container">
      {csvData && csvFilename && (
        <button onClick={handleCsvDownload} className="download-button csv">
          Download CSV
        </button>
      )}
      {jsonString && jsonFilename && (
        <button onClick={handleJsonDownload} className="download-button json">
          Download JSON
        </button>
      )}
    </div>
  );
}

export default DownloadOptions;