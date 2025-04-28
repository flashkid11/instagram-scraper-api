// src/components/InputForm.js
import React from 'react';
import './InputForm.css'; // Make sure CSS is imported

function InputForm({
    platform,
    setPlatform,
    // Instagram state
    instagramUsernames, // NEW
    setInstagramUsernames, // NEW
    limit,             // Keep limit
    setLimit,          // Keep setter for limit
    // TikTok state
    hashtags,
    setHashtags,
    resultsPerPage,
    setResultsPerPage,
    // Common props
    onSubmit,
    isLoading
}) {

    const handlePlatformChange = (event) => {
        setPlatform(event.target.value);
    };

    const handleHashtagChange = (event) => {
         setHashtags(event.target.value);
    };

    // Handle changes for the new Instagram username input
    const handleInstagramUsernameChange = (event) => {
        setInstagramUsernames(event.target.value);
    };


    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="input-form">
            <div className="form-group"> {/* Wrap platform select */}
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
                        {/* Changed Label and Input */}
                        <label htmlFor="instagram-usernames">Instagram Usernames (comma-separated):</label>
                        <input
                            id="instagram-usernames"
                            type="text"
                            value={instagramUsernames}
                            onChange={handleInstagramUsernameChange} // Use new handler
                            placeholder="e.g. nasa, spacex, natgeo" // Updated placeholder
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="form-group">
                        {/* Label might need adjustment depending on actor */}
                        <label htmlFor="limit">Max Posts per Username:</label>
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
                        <label htmlFor="resultsPerPage">Results Limit (per Hashtag):</label> {/* Simplified label */}
                        <input
                            id="resultsPerPage"
                            type="number"
                            min="1"
                            value={resultsPerPage}
                            onChange={(e) => setResultsPerPage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            disabled={isLoading}
                            required
                        />
                    </div>
                </>
            )}

            {/* Submit Button remains the same */}
            <button type="submit" disabled={isLoading} className="submit-button">
                {isLoading ? 'Scraping...' : 'Start Scraping'}
            </button>
        </form>
    );
}

export default InputForm;