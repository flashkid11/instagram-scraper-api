// src/App.js
import React, { useState, useRef, useCallback } from 'react';
import InputForm from './components/InputForm';
import ResultsTable from './components/ResultsTable';
import DownloadOptions from './components/DownloadOptions'; // Renamed/New component
import './App.css';

const BACKEND_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/scrape';

// Define loading stages
const LOADING_STAGES = {
    INITIALIZING: "Initializing scraper...",
    SENDING: "Sending request to Apify...",
    WAITING: "Waiting for Apify results (this may take a while)...",
    PROCESSING: "Processing received data...",
    CANCELLING: "Attempting to cancel request...",
};

function App() {
    const [urls, setUrls] = useState('');
    const [limit, setLimit] = useState(10);
    const [csvData, setCsvData] = useState('');
    const [jsonData, setJsonData] = useState(null); // State for raw JSON data
    const [filename, setFilename] = useState('');
    const [jsonFilename, setJsonFilename] = useState(''); // State for JSON filename suggestion
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState(null); // State for granular message
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    // Ref to hold the AbortController
    const abortControllerRef = useRef(null);

    const handleScrapeSubmit = useCallback(async () => {
        // --- Reset state ---
        setIsLoading(true);
        setError(null);
        setCsvData('');
        setJsonData(null); // Reset JSON data
        setFilename('');
        setJsonFilename('');
        setMessage('');
        setLoadingStage(LOADING_STAGES.INITIALIZING);

        // --- Prepare request ---
        const urlList = urls.split('\n')
            .map(url => url.trim())
            .filter(url => url !== '');

        if (urlList.length === 0) {
            setError("Please enter at least one valid Instagram URL.");
            setIsLoading(false);
            setLoadingStage(null);
            return;
        }

        // --- Setup AbortController ---
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setLoadingStage(LOADING_STAGES.SENDING);
        console.log("Sending URLs:", urlList, "Limit:", limit);

        try {
            const response = await fetch(BACKEND_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    urls: urlList,
                    limit: limit
                }),
                signal: signal, // Pass the signal to fetch
            });

            // Check if the request was aborted before proceeding
            if (signal.aborted) {
                 // Error already set by handleCancelRequest
                 // console.log("Fetch aborted by user.");
                 return;
            }

            setLoadingStage(LOADING_STAGES.WAITING); // Might move this before fetch if backend is slow to respond initially

            const data = await response.json(); // Try to parse JSON regardless of status

            if (signal.aborted) return; // Check again after await

            setLoadingStage(LOADING_STAGES.PROCESSING);

            if (!response.ok) {
                console.error("API Error Response:", data);
                throw new Error(data.error || `HTTP error! Status: ${response.status}`);
            }

            // --- Success ---
            console.log("API Success Response:", data);
            setMessage(data.message || 'Scraping successful!');
            if (data.csvData) {
                setCsvData(data.csvData);
                setFilename(data.filename || 'download.csv');
            } else {
                // Handle cases with success message but no actual data (e.g., no posts found)
                setCsvData('');
                setFilename('');
            }
             // Store JSON data if available (from backend modification)
             if (data.jsonData) {
                setJsonData(data.jsonData);
                setJsonFilename(data.jsonFilename || 'download.json');
            } else {
                setJsonData(null);
                setJsonFilename('');
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Fetch aborted');
                setError('Request cancelled by user.');
                // Keep isLoading true briefly so cancel message shows
                setTimeout(() => setIsLoading(false), 500);
            } else {
                console.error("Error during fetch or processing:", err);
                setError(err.message || 'Failed to fetch data. Check console & backend.');
                setCsvData('');
                setJsonData(null);
                setFilename('');
                setJsonFilename('');
                setIsLoading(false); // Ensure loading stops on other errors
            }
        } finally {
             // Only set isLoading to false if it wasn't an AbortError we're briefly showing message for
             if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                setIsLoading(false);
             }
             setLoadingStage(null); // Clear loading stage message
             abortControllerRef.current = null; // Clear the controller ref
        }
    }, [urls, limit]); // Dependencies for useCallback

    const handleCancelRequest = () => {
        if (abortControllerRef.current) {
            setLoadingStage(LOADING_STAGES.CANCELLING); // Update stage
            abortControllerRef.current.abort(); // Abort the fetch
            console.log("Cancel requested");
            // Error state will be set in the catch block of handleScrapeSubmit
        }
    };

    return (
        <div className="App">
            <h1>📸 Instagram Scraper UI</h1>

            <InputForm
                urls={urls}
                setUrls={setUrls}
                limit={limit}
                setLimit={setLimit}
                onSubmit={handleScrapeSubmit}
                isLoading={isLoading}
            />

            {/* --- Loading / Status Display --- */}
            {isLoading && (
                <div className="status-container">
                    <div className="loading-indicator">{loadingStage || 'Loading...'}</div>
                    {/* Show Cancel button only while actively loading and controller exists */}
                    {loadingStage !== LOADING_STAGES.CANCELLING && abortControllerRef.current && (
                        <button onClick={handleCancelRequest} className="cancel-button">
                            Cancel
                        </button>
                    )}
                </div>
            )}
            {error && <div className="error-message">Error: {error}</div>}
            {message && !error && !isLoading && <div className="success-message">{message}</div>}

            {/* --- Results & Download --- */}
            {/* Pass both CSV and JSON data to ResultsTable */}
            {/* ResultsTable now primarily uses jsonData for table features if available */}
            {(csvData || (jsonData && jsonData.length > 0)) && !isLoading && !error && (
              <ResultsTable csvData={csvData} jsonData={jsonData} />
            )}

            {/* Pass data needed for downloads */}
            <DownloadOptions
                csvData={csvData}
                jsonData={jsonData}
                csvFilename={filename}
                jsonFilename={jsonFilename}
            />
        </div>
    );
}

export default App;