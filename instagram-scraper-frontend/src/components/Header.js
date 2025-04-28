// src/components/Header.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

function Header() {
    const githubLink = "https://github.com/flashkid11/instagram-scraper-api"; // Your repo link

    return (
        <header className="app-header">
            <div className="header-content">
                <h1 className="header-title">📊 Social Scraper</h1>
                <nav className="header-nav">
                    <ul>
                        <li>
                            <NavLink
                                to="/"
                                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                            >
                                Scraper
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/how-to-use"
                                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                            >
                                How to Use
                            </NavLink>
                        </li>
                        {/* --- Add Pricing Link --- */}
                        <li>
                            <NavLink
                                to="/pricing" // Link to the new pricing page
                                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                            >
                                Pricing
                            </NavLink>
                        </li>
                        {/* --- End Add Pricing Link --- */}
                        <li>
                            <a
                                href={githubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className='nav-link external-link'
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

export default Header;