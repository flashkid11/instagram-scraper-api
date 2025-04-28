// src/pages/Pricing.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Pricing.css'; // We'll create this CSS file next

function Pricing() {
    // Your GitHub links (can be passed as props or defined here)
    const githubLink = "https://github.com/flashkid11/instagram-scraper-api";
    const issuesLink = `${githubLink}/issues`;

    // Pricing Calculation (as per your image)
    const igCost = 2.3;
    const tiktokCost = 3.05;
    const profitMarkupMultiplier = 3; // 1 + 200% profit

    const igPrice = (igCost * profitMarkupMultiplier).toFixed(2);
    const tiktokPrice = (tiktokCost * profitMarkupMultiplier).toFixed(2);

    return (
        <div className="pricing-container">
            {/* --- English Version --- */}
            <section>
                <h2>Pricing Information</h2>
                <p>
                    This tool utilizes external services from Apify to perform the scraping tasks.
                    Using these services incurs costs based on the amount of data processed.
                </p>
                <p>
                    Our pricing is calculated based on the number of results successfully scraped, charged per <strong>1,000 results</strong>.
                    This includes the underlying Apify actor costs plus a service fee to maintain and operate this tool.
                </p>

                <h3>Usage Pricing</h3>
                <div className="pricing-table-wrapper">
                    <table className="pricing-table">
                        <thead>
                            <tr>
                                <th>Platform</th>
                                <th>Price per 1,000 Results (USD)</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Instagram</td>
                                <td className="price-value">${igPrice}</td>
                                <td>Based on scraping posts or profile data.</td>
                            </tr>
                            <tr>
                                <td>TikTok</td>
                                <td className="price-value">${tiktokPrice}</td>
                                <td>Based on scraping hashtag results. Includes actor startup cost component.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h4>What counts as a "result"?</h4>
                <p>
                    Generally, one result corresponds to one successfully scraped item, such as:
                </p>
                <ul>
                    <li>One Instagram post's details.</li>
                    <li>One TikTok video's details found via a hashtag search.</li>
                    {/* Add more examples if the actors retrieve different types of data */}
                </ul>
                <p>
                    <em>(Note: This pricing structure does not currently involve a recurring monthly subscription.)</em>
                </p>

                <h4>Disclaimer</h4>
                <p>
                    Prices are based on current Apify actor costs and are subject to change without prior notice if underlying service costs change. We strive to keep pricing transparent and fair.
                </p>
            </section>

            <hr className="section-divider" />

            {/* --- Chinese Version (繁體中文) --- */}
            <section>
                <h2>價格資訊 (Pricing Information)</h2>
                <p>
                    本工具使用 Apify 的外部服務來執行抓取任務。使用這些服務會根據處理的數據量產生費用。
                </p>
                <p>
                    我們的價格根據成功抓取的<strong>結果數量</strong>計算，以<strong>每 1,000 筆結果</strong>為單位收費。
                    此價格包含基礎的 Apify actor 成本以及用於維護和運營此工具的服務費。
                </p>

                <h3>使用費用 (Usage Pricing)</h3>
                <div className="pricing-table-wrapper">
                    <table className="pricing-table">
                        <thead>
                            <tr>
                                <th>平台 (Platform)</th>
                                <th>每 1,000 筆結果的價格 (美元)</th>
                                <th>說明 (Notes)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Instagram</td>
                                <td className="price-value">${igPrice}</td>
                                <td>基於抓取的帖子或個人資料數據。</td>
                            </tr>
                            <tr>
                                <td>TikTok</td>
                                <td className="price-value">${tiktokPrice}</td>
                                <td>基於抓取的話題標籤結果。包含 actor 啟動成本部分。</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h4>什麼算作一筆「結果」？(What counts as a "result"?)</h4>
                <p>
                    一般而言，一筆結果對應一個成功抓取的項目，例如：
                </p>
                <ul>
                    <li>一則 Instagram 帖子的詳細資訊。</li>
                    <li>一個透過話題標籤搜索找到的 TikTok 影片的詳細資訊。</li>
                    {/* 如果 actor 會抓取其他類型數據，可在此添加更多範例 */}
                </ul>
                 <p>
                    <em>(註：目前的價格結構不包含定期的月度訂閱費用。)</em>
                </p>

                <h4>免責聲明 (Disclaimer)</h4>
                <p>
                    價格是基於當前的 Apify actor 成本，如果基礎服務成本發生變化，價格可能會隨時更改，恕不另行通知。我們努力保持價格的透明與公平。
                </p>
            </section>

            {/* --- Common Links --- */}
            <section className="pricing-footer-links">
                 <p>
                    有任何疑問或需要進一步協助？ 請透過 GitHub{' '}
                    <a href={issuesLink} target="_blank" rel="noopener noreferrer">提交一個 Issue</a>。
                    (Questions? Please <a href={issuesLink} target="_blank" rel="noopener noreferrer">open an issue</a> on GitHub.)
                </p>
                 <p>
                    <Link to="/how-to-use">如何使用指南 (How to Use Guide)</Link>
                    {' | '}
                    <Link to="/">返回抓取工具 (Back to Scraper)</Link>
                 </p>
            </section>
        </div>
    );
}

export default Pricing;