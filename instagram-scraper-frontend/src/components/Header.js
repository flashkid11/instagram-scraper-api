// src/components/Header.js
import React from 'react';
import { NavLink } from 'react-router-dom'; // Use NavLink for active styling
import './Header.css';

function Header() {
    return (
        <header className="app-header">
            <div className="header-content">
                <h1 className="header-title">📊 Social media Scraper</h1>
                <nav className="header-nav">
                    <ul>
                        <li>
                            <NavLink
                                to="/" // Link to the main scraper page
                                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                            >
                                Scraper
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/how-to-use" // Link to the instructions page
                                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                            >
                                How to Use
                            </NavLink>
                        </li>
                        {/* Optional: Link to GitHub */}
                        <li>
                            <a
                                href="https://github.com/flashkid11/instagram-scraper-api" // Replace with your actual repo link
                                target="_blank"
                                rel="noopener noreferrer"
                                className='nav-link external-link' // Style differently maybe
                            >
                                GitHub ↗
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}

// Replace YOUR_GITHUB_REPO_LINK_HERE with your repo URL

export default Header;