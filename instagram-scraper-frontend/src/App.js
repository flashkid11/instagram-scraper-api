// src/App.js
import React, { useState, useRef, useCallback } from 'react';
import InputForm from './components/InputForm';
import ResultsTable from './components/ResultsTable';
import DownloadOptions from './components/DownloadOptions';
import './App.css';

// Backend base URL (adjust if needed, e.g., different port)
const BACKEND_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/scrape';

const LOADING_STAGES = {
    INITIALIZING: "Initializing scraper...",
    SENDING: "Sending request...",
    WAITING: "Waiting for Apify results (this may take a while)...",
    PROCESSING: "Processing received data...",
    CANCELLING: "Attempting to cancel request...",
};

function App() {
    // --- State ---
    const [platform, setPlatform] = useState('instagram'); // 'instagram' or 'tiktok'

    // Instagram state
    const [urls, setUrls] = useState('');
    const [limit, setLimit] = useState(10);

    // TikTok state
    const [hashtags, setHashtags] = useState(''); // Comma-separated string from input
    const [resultsPerPage, setResultsPerPage] = useState(100); // Default for TikTok

    // Common state
    const [csvData, setCsvData] = useState('');
    const [jsonData, setJsonData] = useState(null);
    const [filename, setFilename] = useState('');
    const [jsonFilename, setJsonFilename] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState(null);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    const abortControllerRef = useRef(null);

    // --- Scrape Handler ---
    const handleScrapeSubmit = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setCsvData('');
        setJsonData(null);
        setFilename('');
        setJsonFilename('');
        setMessage('');
        setLoadingStage(LOADING_STAGES.INITIALIZING);

        // Determine endpoint and payload based on platform
        let apiUrl = '';
        let payload = {};
        let inputDescription = ''; // For logging

        if (platform === 'instagram') {
            apiUrl = `${BACKEND_BASE_URL}/instagram`;
            const urlList = urls.split('\n').map(url => url.trim()).filter(url => url !== '');
            if (urlList.length === 0) {
                setError("Please enter at least one valid Instagram URL.");
                setIsLoading(false); setLoadingStage(null); return;
            }
            payload = { urls: urlList, limit: limit };
            inputDescription = `URLs: ${urlList.slice(0, 2).join(', ')}... Limit: ${limit}`; // Log snippet

        } else if (platform === 'tiktok') {
            apiUrl = `${BACKEND_BASE_URL}/tiktok`;
            // Split comma-separated hashtags, trim whitespace, filter empty
            const hashtagList = hashtags.split(',')
                                    .map(tag => tag.trim())
                                    .filter(tag => tag !== '');
            if (hashtagList.length === 0) {
                setError("Please enter at least one valid TikTok hashtag.");
                setIsLoading(false); setLoadingStage(null); return;
            }
            payload = { hashtags: hashtagList, resultsPerPage: resultsPerPage };
            inputDescription = `Hashtags: ${hashtagList.join(', ')} Results/Page: ${resultsPerPage}`;
        } else {
            setError("Invalid platform selected.");
            setIsLoading(false); setLoadingStage(null); return;
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setLoadingStage(LOADING_STAGES.SENDING);
        console.log(`Sending ${platform} request to ${apiUrl} with payload:`, payload);
        console.log(`Input Details: ${inputDescription}`);


        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: signal,
            });

            if (signal.aborted) return;

            setLoadingStage(LOADING_STAGES.WAITING);
            const data = await response.json();
            if (signal.aborted) return;
            setLoadingStage(LOADING_STAGES.PROCESSING);

            if (!response.ok) {
                console.error("API Error Response:", data);
                throw new Error(data.error || `HTTP error! Status: ${response.status}`);
            }

            console.log("API Success Response:", data);
            setMessage(data.message || `Scraping successful for ${platform}!`);
            setCsvData(data.csvData || '');
            setJsonData(data.jsonData || null); // Store JSON data
            setFilename(data.filename || `${platform}_download.csv`);
            setJsonFilename(data.jsonFilename || `${platform}_download.json`);

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Fetch aborted');
                setError('Request cancelled by user.');
                setTimeout(() => setIsLoading(false), 500); // Show message briefly
            } else {
                console.error("Error during fetch or processing:", err);
                setError(err.message || `Failed to fetch ${platform} data. Check console & backend.`);
                setCsvData(''); setJsonData(null); setFilename(''); setJsonFilename('');
                setIsLoading(false);
            }
        } finally {
             if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                setIsLoading(false);
             }
             setLoadingStage(null);
             abortControllerRef.current = null;
        }
    // Include all relevant state variables in dependencies
    }, [platform, urls, limit, hashtags, resultsPerPage]);

    const handleCancelRequest = () => {
        if (abortControllerRef.current) {
            setLoadingStage(LOADING_STAGES.CANCELLING);
            abortControllerRef.current.abort();
            console.log("Cancel requested");
        }
    };

    return (
        <div className="App">
            <h1>📸 Social Media Scraper UI 🎵</h1> {/* Updated Title */}

            <InputForm
                platform={platform}
                setPlatform={setPlatform}
                urls={urls}
                setUrls={setUrls}
                limit={limit}
                setLimit={setLimit}
                hashtags={hashtags}
                setHashtags={setHashtags}
                resultsPerPage={resultsPerPage}
                setResultsPerPage={setResultsPerPage}
                onSubmit={handleScrapeSubmit}
                isLoading={isLoading}
            />

            {/* --- Status Display --- */}
            {isLoading && (
                <div className="status-container">
                    <div className="loading-indicator">{loadingStage || 'Loading...'}</div>
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
             {/* Pass platform and jsonData to ResultsTable */}
            {(jsonData && jsonData.length > 0) && !isLoading && !error && (
              <ResultsTable jsonData={jsonData} platform={platform} />
             )}
            {/* Pass necessary data for downloads */}
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