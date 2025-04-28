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
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Enable CORS for all /api/* routes

# --- Helper Functions & Configuration ---

if not APIFY_TOKEN:
    print("CRITICAL ERROR: APIFY_TOKEN not found in environment variables.")
    # exit() # Uncomment to force exit if token is missing

def initialize_apify_client():
    """Initializes and returns the ApifyClient or None if token is missing."""
    if not APIFY_TOKEN:
        print("Warning: APIFY_TOKEN is missing. Scraping will fail.")
        return None
    return ApifyClient(APIFY_TOKEN)

# --- Fieldnames for Different Platforms ---
INSTAGRAM_CSV_FIELDNAMES = [
    'inputUrl', 'id', 'type', 'shortCode', 'caption', 'url',
    'commentsCount', 'firstComment', 'likesCount', 'timestamp',
    'ownerFullName', 'ownerUsername', 'ownerId', 'displayUrl',
    'alt', 'isSponsored'
]

# Define fieldnames based on the provided TikTok sample output
TIKTOK_CSV_FIELDNAMES = [
    'authorName', 'authorUsername', 'authorAvatar', 'text', 'diggCount',
    'shareCount', 'playCount', 'commentCount', 'collectCount',
    'videoDuration', 'musicName', 'musicAuthor', 'musicOriginal',
    'createTimeISO', 'webVideoUrl', 'hashtagInput' # Added hashtagInput for context
]

def clean_csv_value(value):
    """Cleans a value for CSV insertion."""
    if isinstance(value, str):
        # Replace newline variations and tabs with a space
        cleaned = value.replace('\r\n', ' ').replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
        # Remove leading/trailing whitespace
        return cleaned.strip()
    return value # Return other types (like numbers) as is

# --- Flask API Routes ---

# --- Instagram Endpoint (Renamed from /api/scrape) ---
@app.route('/api/scrape/instagram', methods=['POST'])
def scrape_instagram_api():
    """API endpoint to handle Instagram scraping requests."""
    client = initialize_apify_client()
    if not client:
        return jsonify({"error": "Server configuration error: Apify API token is missing."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request: No JSON body found."}), 400

    urls_input = data.get('urls')
    try:
        results_limit_per_profile = int(data.get('limit', 10))
        if results_limit_per_profile < 1:
            results_limit_per_profile = 1
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'limit' value. Must be a positive integer."}), 400

    if not urls_input or not isinstance(urls_input, list):
        return jsonify({"error": "Invalid 'urls' value. Must be a non-empty list of strings."}), 400

    input_urls = []
    for url in urls_input:
        if isinstance(url, str) and url.strip():
            if "instagram.com" in url.strip() and url.strip().startswith("http"):
                input_urls.append(url.strip())
            else:
                print(f"API Warning (Instagram): Skipping potentially invalid URL format: {url}")
                # Optionally return an error here if needed

    if not input_urls:
        return jsonify({"error": "No valid Instagram URLs provided in the 'urls' list."}), 400

    run_input = {
        "directUrls": input_urls,
        "resultsType": "posts",
        "resultsLimit": results_limit_per_profile,
        "searchType": "user", # Ensure this is valid for the actor used
        "searchLimit": 1,
        "addParentData": False,
    }

    print(f"API (Instagram): Starting scraper for: {', '.join(input_urls)} with limit {results_limit_per_profile}")

    try:
        print(f"API (Instagram): Calling Apify actor 'RB9HEZitC8hIUXAha' with input: {run_input}")
        # --- IMPORTANT: Replace 'RB9HEZitC8hIUXAha' if you use a different Instagram actor ---
        actor_run = client.actor("RB9HEZitC8hIUXAha").call(run_input=run_input)
        print(f"API (Instagram): Apify actor call finished. Run details: {actor_run}")

        print(f"API (Instagram): Fetching results from actor run...")
        items_iterator = client.run(actor_run["id"]).dataset().iterate_items()
        items_raw = list(items_iterator)

        if not items_raw:
            print(f"API (Instagram): No items found for URLs: {', '.join(input_urls)}")
            return jsonify({
                "message": "Scraping completed, but no posts found for the given Instagram URLs or criteria.",
                "csvData": "", "jsonData": [], "filename": "", "jsonFilename": ""
            }), 200

        print(f"API (Instagram): Found {len(items_raw)} items. Generating CSV data...")

        output_buffer = io.StringIO()
        writer = csv.DictWriter(output_buffer, fieldnames=INSTAGRAM_CSV_FIELDNAMES, extrasaction='ignore', quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for item in items_raw:
            row_data = {field: clean_csv_value(item.get(field, '')) for field in INSTAGRAM_CSV_FIELDNAMES}
            writer.writerow(row_data)

        csv_data_string = output_buffer.getvalue()
        output_buffer.close()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        try:
            first_url_part = input_urls[0].split('//')[-1].split('/')[1]
            base_filename = f"instagram_{first_url_part}_{timestamp}"
        except IndexError:
            base_filename = f"instagram_posts_{timestamp}"

        csv_filename = f"{base_filename}.csv"
        json_filename = f"{base_filename}.json"

        print(f"API (Instagram): Successfully generated CSV data ({len(csv_data_string)} bytes).")

        return jsonify({
            "message": f"Successfully scraped {len(items_raw)} Instagram posts.",
            "csvData": csv_data_string,
            "jsonData": items_raw,
            "filename": csv_filename,
            "jsonFilename": json_filename
        }), 200

    except Exception as e:
        print(f"API Error (Instagram): An error occurred: {e}")
        traceback.print_exc()
        return jsonify({"error": f"An internal server error occurred (Instagram): {type(e).__name__} - {e}"}), 500


# --- TikTok Endpoint ---
@app.route('/api/scrape/tiktok', methods=['POST'])
def scrape_tiktok_api():
    """API endpoint to handle TikTok scraping requests."""
    client = initialize_apify_client()
    if not client:
        return jsonify({"error": "Server configuration error: Apify API token is missing."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request: No JSON body found."}), 400

    # --- Get TikTok specific inputs ---
    hashtags_input = data.get('hashtags') # Expecting a list of hashtags
    try:
        # Use 'resultsPerPage' for TikTok actor
        results_per_page = int(data.get('resultsPerPage', 100))
        if results_per_page < 1:
            results_per_page = 1
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'resultsPerPage' value. Must be a positive integer."}), 400

    if not hashtags_input or not isinstance(hashtags_input, list):
        return jsonify({"error": "Invalid 'hashtags' value. Must be a non-empty list of strings."}), 400

    # Filter out empty strings
    input_hashtags = [tag.strip() for tag in hashtags_input if isinstance(tag, str) and tag.strip()]

    if not input_hashtags:
        return jsonify({"error": "No valid hashtags provided in the 'hashtags' list."}), 400

    # --- Configure TikTok Apify Actor Input ---
    run_input = {
        "hashtags": input_hashtags,
        "resultsPerPage": results_per_page,
        # Add other TikTok actor options if needed, e.g., proxyCountryCode
        # "proxyCountryCode": "None", # Example from docs
    }

    print(f"API (TikTok): Starting scraper for hashtags: {', '.join(input_hashtags)} with results/page {results_per_page}")

    try:
        # --- Run TikTok Apify Actor ---
        print(f"API (TikTok): Calling Apify actor 'clockworks/tiktok-scraper' with input: {run_input}")
        actor_run = client.actor("clockworks/tiktok-scraper").call(run_input=run_input)
        print(f"API (TikTok): Apify actor call finished. Run details: {actor_run}")

        # --- Fetch Results ---
        print(f"API (TikTok): Fetching results from actor run...")
        items_iterator = client.run(actor_run["id"]).dataset().iterate_items()
        items_raw = list(items_iterator)

        if not items_raw:
            print(f"API (TikTok): No items found for hashtags: {', '.join(input_hashtags)}")
            return jsonify({
                "message": f"Scraping completed, but no posts found for the given TikTok hashtags.",
                "csvData": "", "jsonData": [], "filename": "", "jsonFilename": ""
            }), 200

        print(f"API (TikTok): Found {len(items_raw)} items. Generating CSV data...")

        # --- Generate CSV String in Memory ---
        output_buffer = io.StringIO()
        writer = csv.DictWriter(output_buffer, fieldnames=TIKTOK_CSV_FIELDNAMES, extrasaction='ignore', quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for item in items_raw:
            # Prepare row data, flattening nested structures
            row_data = {
                'authorName': clean_csv_value(item.get('authorMeta', {}).get('name', '')),
                'authorUsername': clean_csv_value(item.get('authorMeta', {}).get('nickName', item.get('authorMeta', {}).get('name', ''))), # Use name if nickName missing
                'authorAvatar': clean_csv_value(item.get('authorMeta', {}).get('avatar', '')),
                'text': clean_csv_value(item.get('text', '')),
                'diggCount': item.get('diggCount', 0),
                'shareCount': item.get('shareCount', 0),
                'playCount': item.get('playCount', 0),
                'commentCount': item.get('commentCount', 0),
                'collectCount': item.get('collectCount', 0),
                'videoDuration': item.get('videoMeta', {}).get('duration', 0),
                'musicName': clean_csv_value(item.get('musicMeta', {}).get('musicName', '')),
                'musicAuthor': clean_csv_value(item.get('musicMeta', {}).get('musicAuthor', '')),
                'musicOriginal': item.get('musicMeta', {}).get('musicOriginal', False),
                'createTimeISO': clean_csv_value(item.get('createTimeISO', '')),
                'webVideoUrl': clean_csv_value(item.get('webVideoUrl', '')),
                'hashtagInput': clean_csv_value(item.get('hashtagInput', ', '.join(input_hashtags))) # Store which hashtags led to this result
            }
            # Ensure only defined fields are written (extrasaction='ignore' handles extras)
            # Keep only keys present in TIKTOK_CSV_FIELDNAMES for the row
            filtered_row = {k: v for k, v in row_data.items() if k in TIKTOK_CSV_FIELDNAMES}
            writer.writerow(filtered_row)


        csv_data_string = output_buffer.getvalue()
        output_buffer.close()

        # --- Prepare Response ---
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        first_hashtag = input_hashtags[0].replace(" ", "_") # Simple filename based on first hashtag
        base_filename = f"tiktok_{first_hashtag}_{timestamp}"
        csv_filename = f"{base_filename}.csv"
        json_filename = f"{base_filename}.json"

        print(f"API (TikTok): Successfully generated CSV data ({len(csv_data_string)} bytes).")

        # --- Return JSON response ---
        return jsonify({
            "message": f"Successfully scraped {len(items_raw)} TikTok posts.",
            "csvData": csv_data_string,
            "jsonData": items_raw,      # Include the raw data list
            "filename": csv_filename,
            "jsonFilename": json_filename
        }), 200

    except Exception as e:
        print(f"API Error (TikTok): An error occurred: {e}")
        traceback.print_exc()
        # Return a generic error message to the client
        return jsonify({"error": f"An internal server error occurred (TikTok): {type(e).__name__} - {e}"}), 500


# --- Run the Flask App ---
if __name__ == '__main__':
    print("Starting Flask server on http://0.0.0.0:5000")
    # Use debug=True for development ONLY. Set to False for production.
    # Use port 5001 if 5000 is taken or if you prefer separation
    app.run(debug=True, host='0.0.0.0', port=5000)