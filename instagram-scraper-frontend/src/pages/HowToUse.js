// src/pages/HowToUse.js
import React from 'react';
import { Link } from 'react-router-dom'; // For internal navigation
import './HowToUse.css'; // Optional: Add specific styles

function HowToUse() {
    // Your GitHub links
    const githubLink = "https://github.com/flashkid11/instagram-scraper-api";
    const issuesLink = `${githubLink}/issues`;
    const stargazersLink = `${githubLink}/stargazers`;

    return (
        <div className="how-to-use-container">
            {/* --- English Version --- */}
            <section>
                <h2>How to Use the Social Scraper</h2>
                <p>
                    This tool helps you scrape publicly available data from Instagram user profiles or TikTok hashtags.
                </p>

                <h3>Scraping Steps</h3>
                <ol>
                    <li>
                        <strong>Select Platform:</strong> Choose either "Instagram" or "TikTok" from the dropdown menu.
                    </li>
                    <li>
                        <strong>Enter Inputs:</strong>
                        <ul>
                            <li><strong>For Instagram:</strong> Enter one or more public Instagram usernames, separated by commas (e.g., <code>nasa, humansofny</code>).</li>
                            <li><strong>For TikTok:</strong> Enter one or more hashtags (<em>without</em> the '#'), separated by commas (e.g., <code>fyp, tech, science</code>).</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Set Limits:</strong>
                        <ul>
                            <li><strong>For Instagram:</strong> Define the maximum number of recent posts you want to retrieve for each username entered.</li>
                            <li><strong>For TikTok:</strong> Define the approximate number of results you want to retrieve per hashtag.</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Start Scraping:</strong> Click the "Start Scraping" button.
                    </li>
                    <li>
                        <strong>Wait for Results:</strong> The process involves communication with external services (Apify) and can take some time, especially for larger requests. You will see status updates like "Sending request..." or "Waiting for results...". You can use the "Cancel" button if you wish to stop the process.
                    </li>
                    <li>
                        <strong>View & Interact with Results:</strong> Once the scraping is complete, the data will appear in the table below the input form. You can:
                        <ul>
                            <li><strong>Search:</strong> Use the "Search Table" box to filter results across all columns.</li>
                            <li><strong>Sort:</strong> Click on column headers (like "Likes", "Comments", "Timestamp") to sort the data. Click again to reverse the sort order.</li>
                            {/* --- FIXED LINE 51 (English) using {} --- */}
                            <li><strong>Navigate Pages:</strong> Use the pagination controls below the table ("{'<< First'}", "{'< Prev'}", "{'Next >'}", "{'Last >>'}", page numbers, items per page) to view large datasets.</li>
                            <li><strong>View Full Text:</strong> For columns like "Caption", "Text", or "Hashtags", hover your mouse over the potentially truncated text to see the full content in a tooltip.</li>
                            <li><strong>View Media/Post Links:</strong> Click on "Link" or "Media Link" to open the original post or media file in a new tab.</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Download Data:</strong> Below the results table, click "Download CSV" or "Download JSON" to save the currently displayed (and filtered) data to your computer.
                    </li>
                </ol>

                <h3>Important Notes</h3>
                <ul>
                    <li>Please use this tool responsibly and respect the terms of service of Instagram and TikTok.</li>
                    <li>The specific data fields available in the results depend on the information provided by the underlying scraping services (Apify actors).</li>
                    <li>Very large requests may take a significant amount of time or potentially hit usage limits depending on service status.</li>
                </ul>
            </section>

            <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #eee' }} />

            {/* --- Chinese Version (繁體中文) --- */}
            <section>
                <h2>如何使用社交媒體抓取工具 (Chinese Guide)</h2>
                <p>
                    本工具可以幫助您從公開的 Instagram 用戶個人資料或 TikTok 話題標籤中抓取數據。
                </p>

                <h3>抓取步驟 (Scraping Steps)</h3>
                <ol>
                    <li>
                        <strong>選擇平台 (Select Platform):</strong> 從下拉菜單中選擇 "Instagram" 或 "TikTok"。
                    </li>
                    <li>
                        <strong>輸入內容 (Enter Inputs):</strong>
                        <ul>
                            <li><strong>對於 Instagram:</strong> 輸入一個或多個公開的 Instagram 用戶名，並用英文逗號分隔 (例如: <code>nasa, humansofny</code>)。</li>
                            <li><strong>對於 TikTok:</strong> 輸入一個或多個話題標籤 (<em>無需</em>輸入 '#' 號)，並用英文逗號分隔 (例如: <code>fyp, tech, science</code>)。</li>
                        </ul>
                    </li>
                    <li>
                        <strong>設置數量限制 (Set Limits):</strong>
                        <ul>
                            <li><strong>對於 Instagram:</strong> 設置您希望為每個輸入的用戶名抓取的最大近期帖子數量。</li>
                            <li><strong>對於 TikTok:</strong> 設置您希望為每個話題標籤抓取的大致結果數量。</li>
                        </ul>
                    </li>
                    <li>
                        <strong>開始抓取 (Start Scraping):</strong> 點擊 "Start Scraping" 按鈕。
                    </li>
                    <li>
                        <strong>等待結果 (Wait for Results):</strong> 此過程需要與外部服務 (Apify) 通信，可能需要一些時間，特別是對於較大的請求。您會看到狀態更新，例如 "Sending request..." 或 "Waiting for results..."。如果需要，您可以點擊 "Cancel" 按鈕停止該過程。
                    </li>
                    <li>
                        <strong>查看與交互結果 (View & Interact with Results):</strong>抓取完成後，數據將顯示在輸入表單下方的結果表格中。您可以：
                        <ul>
                            <li><strong>搜索 (Search):</strong> 使用 "Search Table" 輸入框在所有列中過濾結果。</li>
                            <li><strong>排序 (Sort):</strong> 點擊列標題（例如 "Likes", "Comments", "Timestamp"）對數據進行排序。再次點擊可反轉排序順序。</li>
                            {/* --- FIXED CORRESPONDING CHINESE LINE using {} --- */}
                            <li><strong>分頁瀏覽 (Navigate Pages):</strong> 使用表格下方的分頁控件（"{'<< First'}", "{'< Prev'}", "{'Next >'}", "{'Last >>'}", 頁碼, 每頁顯示數量）查看大型數據集。</li>
                            <li><strong>查看全文 (View Full Text):</strong> 對於像 "Caption"、"Text" 或 "Hashtags" 這樣的列，將鼠標懸停在可能被截斷的文本上，可以在提示框中看到完整內容。</li>
                            <li><strong>查看媒體/帖子鏈接 (View Media/Post Links):</strong> 點擊 "Link" 或 "Media Link" 可在新標籤頁中打開原始帖子或媒體文件。</li>
                        </ul>
                    </li>
                    <li>
                        <strong>下載數據 (Download Data):</strong> 在結果表格下方，點擊 "Download CSV" 或 "Download JSON" 按鈕，將當前顯示（已過濾）的數據保存到您的計算機。
                    </li>
                </ol>

                <h3>重要提示 (Important Notes)</h3>
                <ul>
                    <li>請負責任地使用本工具，並遵守 Instagram 和 TikTok 的服務條款。</li>
                    <li>結果中可用的具體數據字段取決於底層抓取服務（Apify actors）提供的信息。</li>
                    <li>非常大的請求可能需要較長時間，並可能因服務狀態而達到使用限制。</li>
                </ul>
            </section>

            {/* --- Common Links --- */}
            <section style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                 <p>
                    覺得這個工具有用？ 不妨在 GitHub 上{' '}
                    <a href={stargazersLink} target="_blank" rel="noopener noreferrer">點個 ⭐ (Star)</a> 支持一下！
                    (Helpful? Consider <a href={stargazersLink} target="_blank" rel="noopener noreferrer">giving it a star ⭐ on GitHub</a>!)
                </p>
                <p>
                    如果您遇到任何問題或有改進建議，請在 GitHub 倉庫中{' '}
                    <a href={issuesLink} target="_blank" rel="noopener noreferrer">提交一個 Issue</a>。
                    (Found issues or have suggestions? Please <a href={issuesLink} target="_blank" rel="noopener noreferrer">open an issue</a>.)
                </p>
                 <p style={{ marginTop: '20px' }}>
                    <Link to="/">返回抓取工具 (Back to Scraper)</Link>
                 </p>
            </section>
        </div>
    );
}

export default HowToUse;