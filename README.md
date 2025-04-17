
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