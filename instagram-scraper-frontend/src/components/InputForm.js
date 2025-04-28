// src/components/InputForm.js
import React from 'react';
import './InputForm.css';

function InputForm({
    platform,         // New: 'instagram' or 'tiktok'
    setPlatform,      // New: Function to set platform
    urls,             // Existing: For Instagram
    setUrls,          // Existing
    limit,            // Existing
    setLimit,         // Existing
    hashtags,         // New: For TikTok
    setHashtags,      // New
    resultsPerPage,   // New: For TikTok
    setResultsPerPage,// New
    onSubmit,         // Existing
    isLoading         // Existing
}) {

    const handlePlatformChange = (event) => {
        setPlatform(event.target.value);
    };

    const handleHashtagChange = (event) => {
         // Store as comma-separated string for simplicity in input field
         setHashtags(event.target.value);
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="input-form">
            {/* Platform Selector */}
            <div className="form-group platform-selector">
                <label htmlFor="platform">Select Platform:</label>
                <select id="platform" value={platform} onChange={handlePlatformChange} disabled={isLoading}>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                </select>
            </div>

            {/* Conditional Inputs */}
            {platform === 'instagram' && (
                <>
                    <div className="form-group">
                        <label htmlFor="urls">Instagram Profile/Post URLs (one per line):</label>
                        <textarea
                            id="urls"
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            rows="4"
                            placeholder="e.g.
https://www.instagram.com/nasa/
https://www.instagram.com/p/C..."
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="limit">Max Posts per Profile/Input URL:</label>
                        <input
                            id="limit"
                            type="number"
                            min="1"
                            value={limit}
                            onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            disabled={isLoading}
                            required
                        />
                    </div>
                </>
            )}

            {platform === 'tiktok' && (
                <>
                    <div className="form-group">
                        <label htmlFor="hashtags">TikTok Hashtags (comma-separated):</label>
                        <input
                            id="hashtags"
                            type="text"
                            value={hashtags}
                            onChange={handleHashtagChange}
                            placeholder="e.g. fyp, tech, funnyvideos"
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="form-group">
                         {/* Using 'resultsPerPage' to match TikTok actor input */}
                        <label htmlFor="resultsPerPage">Results Per Page (per Hashtag):</label>
                        <input
                            id="resultsPerPage"
                            type="number"
                            min="1"
                            // max="1000" // Actor might have a limit
                            value={resultsPerPage}
                            onChange={(e) => setResultsPerPage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            disabled={isLoading}
                            required
                        />
                    </div>
                </>
            )}


            <button type="submit" disabled={isLoading} className="submit-button">
                {isLoading ? 'Scraping...' : 'Start Scraping'}
            </button>
        </form>
    );
}

export default InputForm;