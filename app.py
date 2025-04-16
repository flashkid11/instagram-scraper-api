import os
import csv
import io # Use io.StringIO to write CSV in memory
from datetime import datetime
from dotenv import load_dotenv
from apify_client import ApifyClient
from flask import Flask, request, jsonify # Import jsonify
from flask_cors import CORS # Import CORS

# Load environment variables from .env file
load_dotenv()
APIFY_TOKEN = os.getenv("APIFY_TOKEN")

# --- Flask App Setup ---
app = Flask(__name__)
# Allow requests from your React app's origin (e.g., http://localhost:3000)
# For development, '*' is often okay, but be more specific in production.
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Enable CORS for /api routes

# --- Helper Functions & Configuration ---

# Check if the API token is loaded (critical)
if not APIFY_TOKEN:
    print("CRITICAL ERROR: APIFY_TOKEN not found in environment variables.")
    # Consider raising an exception or exiting if token is essential for startup
    # exit() # Uncomment to force exit if token is missing


def initialize_apify_client():
    """Initializes and returns the ApifyClient or None if token is missing."""
    if not APIFY_TOKEN:
        return None
    return ApifyClient(APIFY_TOKEN)

CSV_FIELDNAMES = [
    'inputUrl', 'id', 'type', 'shortCode', 'caption', 'url',
    'commentsCount', 'firstComment', 'likesCount', 'timestamp',
    'ownerFullName', 'ownerUsername', 'ownerId', 'displayUrl',
    'alt', 'isSponsored'
]

# --- Flask API Route ---

@app.route('/api/scrape', methods=['POST']) # API endpoint, accepts POST
def scrape_api():
    """API endpoint to handle scraping requests."""
    client = initialize_apify_client()
    if not client:
        # Return a JSON error response
        return jsonify({"error": "Server configuration error: Apify API token is missing."}), 500

    # --- Get Input from JSON Body ---
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request: No JSON body found."}), 400

    urls_input = data.get('urls') # Expecting a list of URLs
    try:
        results_limit_per_profile = int(data.get('limit', 10))
        if results_limit_per_profile < 1:
            results_limit_per_profile = 1
    except (ValueError, TypeError):
         return jsonify({"error": "Invalid 'limit' value. Must be an integer."}), 400

    if not urls_input or not isinstance(urls_input, list) or not all(isinstance(url, str) for url in urls_input):
         return jsonify({"error": "Invalid 'urls' value. Must be a non-empty list of strings."}), 400

    # Filter out any potentially empty strings just in case
    input_urls = [url.strip() for url in urls_input if url.strip()]
    if not input_urls:
         return jsonify({"error": "No valid URLs provided in the 'urls' list."}), 400


    # --- Configure Apify Actor Input ---
    run_input = {
        "directUrls": input_urls,
        "resultsType": "posts",
        "resultsLimit": results_limit_per_profile,
        "searchType": "hashtag", # Review if needed for profile scraping
        "searchLimit": 1,
        "addParentData": False,
    }

    print(f"API: Starting Instagram scraper for: {', '.join(input_urls)}")

    try:
        # --- Run Apify Actor ---
        actor_call = client.actor("RB9HEZitC8hIUXAha").call(run_input=run_input)
        dataset_id = actor_call.get("defaultDatasetId")

        if not dataset_id:
            print(f"API Error: Could not get dataset ID. Actor result: {actor_call}")
            return jsonify({"error": "Scraping failed: Could not get dataset ID from Apify."}), 500

        print(f"API: Apify Actor run finished. Dataset ID: {dataset_id}")

        # --- Fetch Results ---
        print(f"API: Fetching results from dataset {dataset_id}...")
        dataset = client.dataset(dataset_id)
        items = list(dataset.iterate_items()) # Convert iterator to list

        if not items:
            print(f"API: No items found for URLs: {', '.join(input_urls)}")
            # Return success, but indicate no data found
            return jsonify({"message": "Scraping completed, but no posts found for the given URLs or criteria.", "csvData": "", "filename": ""}), 200


        print(f"API: Found {len(items)} items. Generating CSV data...")

        # --- Generate CSV String in Memory ---
        output_buffer = io.StringIO()
        writer = csv.DictWriter(output_buffer, fieldnames=CSV_FIELDNAMES, extrasaction='ignore')
        writer.writeheader()
        for item in items:
            row_data = {field: item.get(field, '') for field in CSV_FIELDNAMES}
            for key in ['caption', 'firstComment', 'alt']:
                if row_data[key]:
                    row_data[key] = str(row_data[key]).replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            writer.writerow(row_data)

        csv_data_string = output_buffer.getvalue()
        output_buffer.close()

        # --- Prepare Response ---
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_filename = f"instagram_posts_{timestamp}.csv"

        print(f"API: Successfully generated CSV data ({len(csv_data_string)} bytes).")
        # Return JSON response with CSV data and filename
        return jsonify({
            "message": f"Successfully scraped {len(items)} posts.",
            "csvData": csv_data_string,
            "filename": csv_filename
        }), 200

    except Exception as e:
        print(f"API Error: An error occurred during scraping or processing: {e}")
        # Log the full error for debugging on the server
        # Return a generic error message to the client
        return jsonify({"error": f"An internal server error occurred: {e}"}), 500

# Remove the old routes if they exist (like '/' and '/scrape' that rendered templates)
# We only need the API endpoint now.

# --- Run the Flask App ---
if __name__ == '__main__':
    # Make sure it runs on a port different from React Dev Server (e.g., 5000)
    # host='0.0.0.0' makes it accessible on your network
    app.run(debug=True, host='0.0.0.0', port=5000)
    # Set debug=False for production