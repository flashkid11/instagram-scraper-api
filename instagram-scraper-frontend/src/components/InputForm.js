// src/components/InputForm.js
import React from 'react';
import './InputForm.css'; // We'll create this CSS file next

function InputForm({ urls, setUrls, limit, setLimit, onSubmit, isLoading }) {
  const handleUrlChange = (event) => {
    setUrls(event.target.value);
  };

  const handleLimitChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setLimit(value >= 1 ? value : 1); // Ensure limit is at least 1
  };

  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission
    if (!urls.trim()) {
        alert("Please enter at least one Instagram URL.");
        return;
    }
    onSubmit(); // Call the submit handler passed from App
  };

  return (
    <form onSubmit={handleSubmit} className="input-form">
      <div className="form-group">
        <label htmlFor="urls">Instagram Profile/Post URLs (one per line):</label>
        <textarea
          id="urls"
          value={urls}
          onChange={handleUrlChange}
          placeholder="e.g., https://www.instagram.com/nasa/
https://www.instagram.com/p/C..."
          rows={5}
          required
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="limit">Max Posts per Profile:</label>
        <input
            type="number"
            id="limit"
            value={limit}
            onChange={handleLimitChange}
            min="1"
            disabled={isLoading}
        />
      </div>
      <button type="submit" className="submit-button" disabled={isLoading}>
        {isLoading ? 'Scraping...' : 'Start Scraping'}
      </button>
    </form>
  );
}

export default InputForm;