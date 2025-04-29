// src/pages/ScraperView.js
import React, { useState, useRef, useCallback } from 'react';
import InputForm from '../components/InputForm';
import ResultsTable from '../components/ResultsTable';
import DownloadOptions from '../components/DownloadOptions';
// Import App.css or specific styles needed for status/error messages if they aren't global
import '../App.css';

// Constants can be defined here or imported

// For local testing
// const BACKEND_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/scrape';

// For vercel deployment
const BACKEND_BASE_URL = process.env.REACT_APP_API_URL || '/api/scrape';

const LOADING_STAGES = {
    INITIALIZING: "Initializing scraper...",
    SENDING: "Sending request...",
    WAITING: "Waiting for Apify results (this may take a while)...",
    PROCESSING: "Processing received data...",
    CANCELLING: "Attempting to cancel request...",
};

function ScraperView() {
    // --- All state related to scraping now lives here ---
    const [platform, setPlatform] = useState('instagram');
    const [instagramUsernames, setInstagramUsernames] = useState('');
    const [limit, setLimit] = useState(10);
    const [hashtags, setHashtags] = useState('');
    const [resultsPerPage, setResultsPerPage] = useState(100);
    const [csvData, setCsvData] = useState('');
    const [jsonData, setJsonData] = useState(null);
    const [filename, setFilename] = useState('');
    const [jsonFilename, setJsonFilename] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState(null);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const abortControllerRef = useRef(null);

    // --- Scraping logic (handleScrapeSubmit) remains the same ---
    const handleScrapeSubmit = useCallback(async () => {
        // ... (exactly the same submit logic as previously in App.js) ...
        
        

        // Reset state before starting a new scrape
        setIsLoading(true);
        setError(null);
        setCsvData('');
        setJsonData(null);
        setFilename('');
        setJsonFilename('');
        setMessage('');
        setLoadingStage(LOADING_STAGES.INITIALIZING);

        let apiUrl = '';
        let payload = {};
        let inputDescription = '';

        if (platform === 'instagram') {
            apiUrl = `${BACKEND_BASE_URL}/instagram`;
            const usernameList = instagramUsernames.split(',').map(name => name.trim()).filter(name => name !== '');
            if (usernameList.length === 0) { setError("Please enter at least one valid Instagram username."); setIsLoading(false); setLoadingStage(null); return; }
            payload = { usernames: usernameList, limit: limit };
            inputDescription = `Usernames: ${usernameList.join(', ')} Limit: ${limit}`;
        } else if (platform === 'tiktok') {
            apiUrl = `${BACKEND_BASE_URL}/tiktok`;
            const hashtagList = hashtags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            if (hashtagList.length === 0) { setError("Please enter at least one valid TikTok hashtag."); setIsLoading(false); setLoadingStage(null); return; }
            payload = { hashtags: hashtagList, resultsPerPage: resultsPerPage };
            inputDescription = `Hashtags: ${hashtagList.join(', ')} Results/Page: ${resultsPerPage}`;
        } else { setError("Invalid platform selected."); setIsLoading(false); setLoadingStage(null); return; }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setLoadingStage(LOADING_STAGES.SENDING);
        console.log(`Sending ${platform} request to ${apiUrl} with payload:`, payload);
        console.log(`Input Details: ${inputDescription}`);

        try {
             const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: signal });
             if (signal.aborted) return;
             setLoadingStage(LOADING_STAGES.WAITING);
             console.log("Response", )
             const data = await response.json();
             if (signal.aborted) return;
             setLoadingStage(LOADING_STAGES.PROCESSING);
             if (!response.ok) { console.error("API Error Response:", data); throw new Error(data.error || `HTTP error! Status: ${response.status}`); }
             console.log("API Success Response:", data);
             setMessage(data.message || `Scraping successful for ${platform}!`);
             setCsvData(data.csvData || '');
             setJsonData(data.jsonData || null);
             setFilename(data.filename || `${platform}_download.csv`);
             setJsonFilename(data.jsonFilename || `${platform}_download.json`);
        } catch (err) {
            if (err.name === 'AbortError') { console.log('Fetch aborted'); setError('Request cancelled by user.'); setTimeout(() => setIsLoading(false), 500); }
            else { console.error("Error during fetch or processing:", err); setError(err.message || `Failed to fetch ${platform} data. Check console & backend.`); setCsvData(''); setJsonData(null); setFilename(''); setJsonFilename(''); setIsLoading(false); }
        } finally {
             if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) setIsLoading(false);
             setLoadingStage(null);
             abortControllerRef.current = null;
        }
    }, [platform, instagramUsernames, limit, hashtags, resultsPerPage]); // Dependencies

    // --- Cancel logic remains the same ---
    const handleCancelRequest = () => {
        if (abortControllerRef.current) {
            setLoadingStage(LOADING_STAGES.CANCELLING);
            abortControllerRef.current.abort();
            console.log("Cancel requested");
        }
    };

    return (
        // Return the JSX for the scraper part of the UI
        <> {/* Use Fragment to avoid unnecessary div */}
            <InputForm
                platform={platform}
                setPlatform={setPlatform}
                instagramUsernames={instagramUsernames}
                setInstagramUsernames={setInstagramUsernames}
                limit={limit}
                setLimit={setLimit}
                hashtags={hashtags}
                setHashtags={setHashtags}
                resultsPerPage={resultsPerPage}
                setResultsPerPage={setResultsPerPage}
                onSubmit={handleScrapeSubmit}
                isLoading={isLoading}
            />

            {/* Status Display */}
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

            {/* Results & Download */}
            {(jsonData || csvData) && !isLoading && !error && (
              <ResultsTable
                  jsonData={jsonData}
                  platform={platform}
                  csvData={csvData}
              />
            )}
            <DownloadOptions
                csvData={csvData}
                jsonData={jsonData}
                csvFilename={filename}
                jsonFilename={jsonFilename}
            />
        </>
    );
}

export default ScraperView;