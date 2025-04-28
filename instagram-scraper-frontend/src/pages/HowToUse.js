// src/pages/HowToUse.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for internal navigation
import './HowToUse.css'; // Optional: Add specific styles

function HowToUse() {
    // Replace with your actual GitHub link
    const githubLink = "YOUR_GITHUB_REPO_LINK_HERE";
    const issuesLink = `${githubLink}/issues`;

    return (
        <div className="how-to-use-container">
            <h2>How to Use the Social Scraper</h2>

            <section>
                <h3>Getting Started</h3>
                <p>
                    This tool allows you to scrape data from Instagram profiles or TikTok hashtags using Apify actors.
                    Ensure the backend server is running and configured with a valid Apify API token in a <code>.env</code> file.
                </p>
                <pre><code># Example .env file content (in backend directory)
APIFY_TOKEN=your_apify_api_token_here
# Optional: Specify Actor IDs if they differ from defaults
# INSTAGRAM_ACTOR_ID=your_username/your_instagram_actor
# TIKTOK_ACTOR_ID=your_username/your_tiktok_actor
</code></pre>
            </section>

            <section>
                <h3>Scraping Steps</h3>
                <ol>
                    <li>
                        <strong>Select Platform:</strong> Choose either "Instagram" or "TikTok" from the dropdown menu.
                    </li>
                    <li>
                        <strong>Enter Inputs:</strong>
                        <ul>
                            <li><strong>Instagram:</strong> Enter one or more Instagram usernames, separated by commas (e.g., <code>nasa, spacex</code>).</li>
                            <li><strong>TikTok:</strong> Enter one or more hashtags (without the '#'), separated by commas (e.g., <code>fyp, tech</code>).</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Set Limits:</strong>
                        <ul>
                            <li><strong>Instagram:</strong> Specify the maximum number of recent posts to scrape per username.</li>
                            <li><strong>TikTok:</strong> Specify the results limit (typically per hashtag search page).</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Start Scraping:</strong> Click the "Start Scraping" button.
                    </li>
                    <li>
                        <strong>Wait:</strong> The process may take some time depending on the number of inputs, limits, and Apify's current load. You'll see status updates. You can cancel the request if needed.
                    </li>
                    <li>
                        <strong>View Results:</strong> Once complete, the scraped data will appear in the results table. You can:
                        <ul>
                            <li>Sort columns by clicking headers.</li>
                            <li>Filter the entire table using the "Search Table" input.</li>
                            <li>Navigate through pages using the pagination controls.</li>
                            <li>Hover over truncated text (like captions or hashtags) to see the full content.</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Download Data:</strong> Use the "Download CSV" or "Download JSON" buttons below the table to save the results.
                    </li>
                </ol>
            </section>

            <section>
                <h3>Important Notes</h3>
                <ul>
                    <li>Scraping requires an Apify account and API token. Apify usage may incur costs based on your plan and usage.</li>
                    <li>Scraping platforms like Instagram and TikTok is subject to their terms of service. Use responsibly.</li>
                    <li>The specific data fields returned depend on the Apify actors used in the backend.</li>
                </ul>
            </section>

            <section>
                <h3>Feedback & Contribution</h3>
                 <p>
                    Found this tool helpful? Consider{' '}
                    <a href={`${githubLink}/stargazers`} target="_blank" rel="noopener noreferrer">giving it a star ⭐ on GitHub</a>!
                </p>
                <p>
                    If you encounter any issues or have suggestions, please{' '}
                    <a href={issuesLink} target="_blank" rel="noopener noreferrer">open an issue</a> on the GitHub repository.
                </p>
                 <p>
                    <Link to="/">Back to Scraper</Link>
                 </p>
            </section>
        </div>
    );
}

export default HowToUse;