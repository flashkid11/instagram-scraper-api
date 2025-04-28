// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import ScraperView from './pages/ScraperView';
import HowToUse from './pages/HowToUse';
import Pricing from './pages/Pricing'; // <-- Import the new Pricing component
import './App.css';

function App() {
    // --- Your GitHub Repository URL ---
    const githubLink = "https://github.com/flashkid11/instagram-scraper-api";
    const issuesLink = `${githubLink}/issues`;
    const stargazersLink = `${githubLink}/stargazers`;

    return (
        <Router>
            <div className="App">
                <Header />

                <main className="app-content">
                    <Routes>
                        <Route path="/" element={<ScraperView />} />
                        <Route path="/how-to-use" element={<HowToUse />} />
                        {/* --- Add Pricing Route --- */}
                        <Route path="/pricing" element={<Pricing />} />
                        {/* --- End Add Pricing Route --- */}
                        <Route path="*" element={
                            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                                <h2>404 - Page Not Found</h2>
                                <p>Sorry, the page you are looking for does not exist.</p>
                                <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>Go back to the Scraper</Link>
                            </div>
                        } />
                    </Routes>
                </main>

                {/* --- Footer --- */}
                <footer className="app-footer">
                    <p>
                        This project is open-source! Find the code on{' '}
                        <a href={githubLink} target="_blank" rel="noopener noreferrer">GitHub</a>.
                    </p>
                    <p>
                        Satisfied with the experience? Please consider{' '}
                        <a href={stargazersLink} target="_blank" rel="noopener noreferrer">giving it a star ⭐</a>!
                    </p>
                    <p>
                        Have feedback or found a bug?{' '}
                        <a href={issuesLink} target="_blank" rel="noopener noreferrer">Open an issue</a>.
                    </p>
                </footer>
            </div>
        </Router>
    );
}

export default App;