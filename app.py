import os
import csv
import io # Use io.StringIO to write CSV in memory
import json # Needed for potential JSON handling if you extend further
from datetime import datetime
from dotenv import load_dotenv
from apify_client import ApifyClient
from flask import Flask, request, jsonify # Import jsonify
from flask_cors import CORS # Import CORS
import traceback # For detailed error logging

# Load environment variables from .env file
load_dotenv()
APIFY_TOKEN = os.getenv("APIFY_TOKEN")

# --- Flask App Setup ---
app = Flask(__name__)
# Allow requests from your React app's origin (e.g., http://localhost:3000)
# For development, '*' is often okay, but be more specific in production.
# Make sure this matches your React dev server or production domain.
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
        print("Warning: APIFY_TOKEN is missing. Scraping will fail.")
        return None
    return ApifyClient(APIFY_TOKEN)

# Predefined fieldnames ensure consistent CSV structure
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
        # Default to 10 if limit isn't provided or invalid
        results_limit_per_profile = int(data.get('limit', 10))
        if results_limit_per_profile < 1:
            results_limit_per_profile = 1 # Ensure limit is at least 1
    except (ValueError, TypeError):
         return jsonify({"error": "Invalid 'limit' value. Must be a positive integer."}), 400

    if not urls_input or not isinstance(urls_input, list):
         return jsonify({"error": "Invalid 'urls' value. Must be a non-empty list of strings."}), 400

    # Filter out any potentially empty strings and validate content
    input_urls = []
    for url in urls_input:
        if isinstance(url, str) and url.strip():
             # Basic check for plausible Instagram URL structure
             if "instagram.com" in url.strip() and url.strip().startswith("http"):
                 input_urls.append(url.strip())
             else:
                 print(f"API Warning: Skipping potentially invalid URL format: {url}")
                 # Optionally return an error if strict validation is needed:
                 # return jsonify({"error": f"Invalid URL format provided: {url}. Must be a valid Instagram URL."}), 400

    if not input_urls:
         return jsonify({"error": "No valid Instagram URLs provided in the 'urls' list."}), 400


    # --- Configure Apify Actor Input ---
    run_input = {
        "directUrls": input_urls,
        "resultsType": "posts",
        "resultsLimit": results_limit_per_profile,
        # --- CHANGE THIS LINE ---
        "searchType": "user",  # Set to a valid enum value like 'user'
        # ------------------------
        "searchLimit": 1,        # This might be ignored when directUrls is used, but keep it valid
        "addParentData": False,
    }

    print(f"API: Starting Instagram scraper for: {', '.join(input_urls)} with limit {results_limit_per_profile}")

    try:
        # --- Run Apify Actor ---
        print(f"API: Calling Apify actor 'RB9HEZitC8hIUXAha' with input: {run_input}")
        actor_run = client.actor("RB9HEZitC8hIUXAha").call(run_input=run_input)
        print(f"API: Apify actor call finished. Run details: {actor_run}")

        # --- Fetch Results ---
        # Actor 'call' waits for completion, so we can directly fetch results from the run object
        print(f"API: Fetching results from actor run...")
        items_iterator = client.run(actor_run["id"]).dataset().iterate_items()
        items_raw = list(items_iterator) # Get the raw list of dictionaries

        if not items_raw:
            print(f"API: No items found for URLs: {', '.join(input_urls)}")
            # Return success, but indicate no data found
            return jsonify({
                "message": "Scraping completed, but no posts found for the given URLs or criteria.",
                "csvData": "",
                "jsonData": [], # Return empty list for JSON
                "filename": "",
                "jsonFilename": ""
             }), 200

        print(f"API: Found {len(items_raw)} items. Generating CSV data...")

        # --- Generate CSV String in Memory ---
        output_buffer = io.StringIO()
        writer = csv.DictWriter(output_buffer, fieldnames=CSV_FIELDNAMES, extrasaction='ignore', quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for item in items_raw: # Iterate over the stored raw items
            # Prepare row data ensuring only defined fields are included
            row_data = {field: item.get(field, '') for field in CSV_FIELDNAMES}
            # Clean up potential problematic characters (newlines, tabs) for CSV
            for key in ['caption', 'firstComment', 'alt', 'ownerFullName']: # Add other text fields if needed
                 if row_data[key] and isinstance(row_data[key], str): # Check if it's a string
                    # Replace newline variations and tabs with a space
                    row_data[key] = row_data[key].replace('\r\n', ' ').replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
                    # Optional: remove leading/trailing whitespace that might remain
                    row_data[key] = row_data[key].strip()
            writer.writerow(row_data)

        csv_data_string = output_buffer.getvalue()
        output_buffer.close()

        # --- Prepare Response ---
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Generate a base filename (e.g., remove https://www, replace / with _)
        # This is a simple example, could be made more robust
        try:
            first_url_part = input_urls[0].split('//')[-1].split('/')[1] # Get username/post ID part
            base_filename = f"instagram_{first_url_part}_{timestamp}"
        except IndexError:
            base_filename = f"instagram_posts_{timestamp}" # Fallback

        csv_filename = f"{base_filename}.csv"
        json_filename = f"{base_filename}.json" # Suggest a JSON filename too

        print(f"API: Successfully generated CSV data ({len(csv_data_string)} bytes).")

        # --- Return JSON response with CSV, raw JSON data, and filenames ---
        return jsonify({
            "message": f"Successfully scraped {len(items_raw)} posts.",
            "csvData": csv_data_string,
            "jsonData": items_raw,      # Include the raw data list
            "filename": csv_filename,   # Filename for CSV
            "jsonFilename": json_filename # Filename for JSON
        }), 200

    except Exception as e:
        print(f"API Error: An error occurred during scraping or processing: {e}")
        # Log the full error traceback for debugging on the server
        traceback.print_exc()
        # Return a generic error message to the client, including the error type
        return jsonify({"error": f"An internal server error occurred: {type(e).__name__} - {e}"}), 500


# --- Run the Flask App ---
if __name__ == '__main__':
    # Make sure it runs on a port different from React Dev Server (e.g., 5000)
    # host='0.0.0.0' makes it accessible on your network
    # Set debug=False for production environments
    print("Starting Flask server on http://0.0.0.0:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)