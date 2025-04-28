// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Added Link for potential 404
import Header from './components/Header';
import ScraperView from './pages/ScraperView'; // Import the view component
import HowToUse from './pages/HowToUse';     // Import the instructions page
import './App.css'; // Main application styles

function App() {
    // --- Your GitHub Repository URL ---
    const githubLink = "https://github.com/flashkid11/instagram-scraper-api";
    const issuesLink = `${githubLink}/issues`; // Construct issues link
    const stargazersLink = `${githubLink}/stargazers`; // Construct stargazers link

    return (
        <Router> {/* Wrap everything in the Router */}
            <div className="App">
                <Header /> {/* Render Header on all pages */}

                <main className="app-content"> {/* Optional: Add a main content wrapper */}
                    <Routes> {/* Define page routes */}
                        <Route path="/" element={<ScraperView />} /> {/* Main scraper page */}
                        <Route path="/how-to-use" element={<HowToUse />} /> {/* Instructions page */}
                        {/* Optional: Add a 404 Not Found route */}
                        <Route path="*" element={
                            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                                <h2>404 - Page Not Found</h2>
                                <p>Sorry, the page you are looking for does not exist.</p>
                                <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>Go back to the Scraper</Link>
                            </div>
                        } />
                    </Routes>
                </main>

                {/* --- Footer with YOUR GitHub links --- */}
                <footer className="app-footer">
                    <p>
                        This project is open-source! Find the code on{' '}
                        <a href={githubLink} target="_blank" rel="noopener noreferrer">
                            GitHub
                        </a>.
                    </p>
                    <p>
                        Satisfied with the experience? Please consider{' '}
                        <a href={stargazersLink} target="_blank" rel="noopener noreferrer">
                            giving it a star ⭐
                        </a>!
                    </p>
                    <p>
                        Have feedback or found a bug?{' '}
                        <a href={issuesLink} target="_blank" rel="noopener noreferrer">
                            Open an issue
                        </a>.
                    </p>
                    {/* Optional: Add your name/handle */}
                    {/* <p className="made-by">Made by flashkid11</p> */}
                </footer>
                {/* --- END FOOTER SECTION --- */}
            </div>
        </Router>
    );
}

export default App;