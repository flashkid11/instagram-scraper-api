# 📸 Instagram Post Scraper Pro 📊

<!--
  ✨ BANNER/SCREENSHOT AREA ✨
  Replace the placeholder image below with an actual screenshot or a custom banner for your project!
  1. Create an image (e.g., using Canva, Figma, or just take a screenshot).
  2. Place the image file in your repository (e.g., create a `docs/images/` folder).
  3. Update the `src` path below.
  4. Update the link `href` to point to your live deployment URL if available.
-->
<p align="center">
  <a href="YOUR_LIVE_DEPLOYMENT_URL_HERE (Optional)"> <!-- Link the image -->
    <img
      src="./docs/images/banner.svg"  <!-- Update this path -->
    />
  </a>
</p>

> **Effortlessly scrape Instagram posts via URLs, view interactive results, and download data as CSV/JSON. Built with React, Flask, and Apify, ready to deploy on Vercel. ✨**

---

<!-- Optional: Add Shields.io Badges Here -->
<!-- These provide quick status info. Customize them for your repo/deployment. -->
<!-- <p align="center">
  <a href="https://github.com/<your_github_user>/<your_repo_name>/blob/main/LICENSE"><img src="https://img.shields.io/github/license/<your_github_user>/<your_repo_name>?style=for-the-badge" alt="License"></a>
  <a href="https://vercel.com/YOUR_VERCEL_USERNAME/YOUR_PROJECT_NAME"><img src="https://img.shields.io/github/deployments/<your_github_user>/<your_repo_name>/production?label=vercel&style=for-the-badge" alt="Vercel Deployment"></a>
  <img src="https://img.shields.io/github/last-commit/<your_github_user>/<your_repo_name>?style=for-the-badge" alt="Last Commit">
</p> -->
<!-- <br/> -->


## Features

*   **URL Input:** Scrape data using one or more Instagram profile or post URLs.
*   **Post Limit:** Specify the maximum number of posts to retrieve per profile.
*   **Apify Integration:** Leverages an Apify actor for robust Instagram scraping.
*   **Interactive Results Table:** Displays scraped data with features like:
    *   Sorting by columns (likes, comments, timestamp, etc.)
    *   Filtering across all columns.
    *   Pagination for large datasets.
*   **Data Download:** Download the scraped results in CSV or JSON format.
*   **Progress & Cancellation:** Shows scraping progress stages and allows cancellation of the request.
*   **Responsive UI:** Designed to work on different screen sizes.
*   **Vercel Deployment:** Configured for easy deployment on Vercel.

## Tech Stack

*   **Frontend:**
    *   React
    *   TanStack Table (React Table v8) - For interactive tables
    *   Papaparse - For robust CSV parsing (used internally by table component)
    *   CSS - For styling
*   **Backend:**
    *   Python 3.x
    *   Flask - Web framework
    *   Apify Client (`apify-client`) - To interact with the Apify API
    *   python-dotenv - To manage environment variables locally
*   **Deployment:**
    *   Vercel



## Local Setup & Installation

Follow these steps to set up and run the project locally.

**Prerequisites:**

*   Git
*   Node.js and npm (or yarn)
*   Python 3.7+ and pip

**Steps:**

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/flashkid11/instagram-scraper-api.git
    cd instagram-scraper-api
    ```

2.  **Backend Setup (Flask API):**
    *   Navigate to the `api` directory:
        ```bash
        cd api
        ```
    *   Create and activate a Python virtual environment:
        ```bash
        python -m venv venv
        source venv/bin/activate  # On Windows use `venv\Scripts\activate`
        ```
    *   Install Python dependencies:
        ```bash
        pip install -r requirements.txt
        ```
    *   **Configuration:** Create a `.env` file inside the `api` directory (this file is *not* committed to Git). Add your Apify token:
        ```dotenv
        # api/.env
        APIFY_TOKEN="YOUR_APIFY_API_TOKEN_HERE"
        ```
    *   Navigate back to the root directory:
        ```bash
        cd ..
        ```

3.  **Frontend Setup (React App):**
    *   Navigate to the frontend directory:
        ```bash
        cd instagram-scraper-frontend
        ```
    *   Install Node.js dependencies:
        ```bash
        npm install
        # or: yarn install
        ```
    *   **(Optional) Configuration for Local API:** If you want `npm start` to automatically point to your local Flask server, create a `.env` file inside the `instagram-scraper-frontend` directory:
        ```dotenv
        # instagram-scraper-frontend/.env
        REACT_APP_API_URL=http://localhost:5000/api/scrape
        ```
        *(Note: The deployed version uses a relative `/api/scrape` path configured in `App.js`)*

## Running Locally

You need to run both the backend and frontend servers concurrently.

1.  **Start the Backend Server:**
    *   Open a terminal in the **root** directory (`INSTAGRAM-SCRAPER-API`).
    *   Make sure your Python virtual environment is activated (`source api/venv/bin/activate`).
    *   Run the Flask development server (it will run on port 5000 by default):
        ```bash
        python api/app.py
        # Or using Flask command:
        # export FLASK_APP=api/app.py # or set FLASK_APP=api\app.py on Windows
        # flask run --port=5000
        ```

2.  **Start the Frontend Server:**
    *   Open a **separate** terminal in the `instagram-scraper-frontend` directory.
    *   Run the React development server (it will usually run on port 3000):
        ```bash
        npm start
        # or: yarn start
        ```

3.  **Access the Application:**
    *   Open your web browser and navigate to `http://localhost:3000`.

## Deployment

This project is configured for deployment on **Vercel**.


## API Endpoint

*   **URL:** `/api/scrape`
*   **Method:** `POST`
*   **Request Body (JSON):**
    ```json
    {
      "urls": ["<instagram_url_1>", "<instagram_url_2>", ...],
      "limit": <number_of_posts_per_profile>
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Successfully scraped X posts.",
      "csvData": "<csv_string_data>",
      "jsonData": [ { /* post object 1 */ }, { /* post object 2 */ }, ... ],
      "filename": "suggested_csv_filename.csv",
      "jsonFilename": "suggested_json_filename.json"
    }
    ```
*   **Error Response (4xx or 5xx):**
    ```json
    {
      "error": "Error message describing the issue."
    }
    ```

## Future Enhancements

*   More robust error handling for individual URL failures (partial results).
*   Option to upload a `.txt` or `.csv` file containing URLs.
*   User accounts and saved scrape history.
*   Directly rendering images/videos in the table.
*   More detailed progress updates (potentially using WebSockets if needed).

## Acknowledgements

*   Powered by the [Apify Platform](https://apify.com/).