# app.py
import os
import csv
import io
import json
from datetime import datetime
from dotenv import load_dotenv
from apify_client import ApifyClient
from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

# Load environment variables from .env file
load_dotenv()
APIFY_TOKEN = os.getenv("APIFY_TOKEN")
# Optional: Define Actor IDs in .env for flexibility
INSTAGRAM_ACTOR_ID = os.getenv("INSTAGRAM_ACTOR_ID", "apify/instagram-scraper") # Replace with your default
TIKTOK_ACTOR_ID = os.getenv("TIKTOK_ACTOR_ID", "clockworks/tiktok-scraper") # Default from docs

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Allow all origins for API routes

# --- Helper Functions & Configuration ---
if not APIFY_TOKEN:
    print("CRITICAL ERROR: APIFY_TOKEN not found in environment variables.")

def initialize_apify_client():
    """Initializes and returns the ApifyClient or None if token is missing."""
    if not APIFY_TOKEN:
        print("Warning: APIFY_TOKEN is missing. Scraping will fail.")
        return None
    return ApifyClient(APIFY_TOKEN)

# --- Fieldnames for CSV ---
# Ensure these match the actual fields returned by the *specific* Apify actors you use
INSTAGRAM_CSV_FIELDNAMES = [
    'id', 'type', 'shortCode', 'caption', 'url', 'commentsCount',
    'dimensionsHeight', 'dimensionsWidth', 'displayUrl', 'likesCount',
    'timestamp', 'ownerFullName', 'ownerUsername', 'ownerId', 'productType',
    'videoViewCount', 'videoPlayCount', 'videoDuration', 'isSponsored',
    'firstComment', 'mentions', 'hashtags', 'alt', 'locationName', 'locationId',
    'inputUrl', # Often included by actors
    # Add/remove fields based on your actor's output when using 'usernames' input
]

TIKTOK_CSV_FIELDNAMES = [
    'authorName', 'authorUsername', 'authorAvatar', 'text', 'diggCount',
    'shareCount', 'playCount', 'commentCount', 'collectCount',
    'videoDuration', 'musicName', 'musicAuthor', 'musicOriginal',
    'createTimeISO', 'webVideoUrl', 'hashtagInput'
]

def clean_csv_value(value):
    """Cleans a value for CSV insertion."""
    if isinstance(value, str):
        cleaned = value.replace('\r\n', ' ').replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
        return cleaned.strip()
    # Handle lists/dicts by converting to JSON string (or handle differently if needed)
    if isinstance(value, (list, dict)):
        try:
            return json.dumps(value)
        except TypeError:
            return str(value) # Fallback to string representation
    return value # Return other types (like numbers, booleans) as is


# --- Instagram Endpoint (Handles Usernames) ---
@app.route('/api/scrape/instagram', methods=['POST'])
def scrape_instagram_api():
    client = initialize_apify_client()
    if not client:
        return jsonify({"error": "Server configuration error: Apify API token missing."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request: No JSON body found."}), 400

    # Get Usernames
    usernames_input = data.get('usernames')
    try:
        results_limit_per_profile = int(data.get('limit', 10))
        if results_limit_per_profile < 1: results_limit_per_profile = 1
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'limit' value. Must be a positive integer."}), 400

    if not usernames_input or not isinstance(usernames_input, list):
        return jsonify({"error": "Invalid 'usernames' value. Must be a non-empty list of strings."}), 400

    input_usernames = [name.strip() for name in usernames_input if isinstance(name, str) and name.strip()]
    input_urls = [f"https://www.instagram.com/{name.strip()}/" for name in usernames_input if isinstance(name, str) and name.strip()]
    if not input_urls:
        return jsonify({"error": "No valid Instagram URL provided."}), 400

    # --- Configure Apify Actor Input for Usernames ---
    # **** IMPORTANT: Double-check the exact field name required by your actor ****
    # Common names: 'usernames', 'profiles', 'username' (if only one allowed)
    run_input = {
        "directUrls": input_urls,
        "resultsType": "posts",
        "resultsLimit": results_limit_per_profile,
        "searchType": "user", # Ensure this is valid for the actor used
        "searchLimit": 1,
        "addParentData": False,
    }

    print(f"API (Instagram): Starting scraper for usernames: {', '.join(input_urls)} with limit {results_limit_per_profile}")
    print(f"API (Instagram): Actor ID: {INSTAGRAM_ACTOR_ID}")
    print(f"API (Instagram): Run Input: {run_input}")


    try:
        # --- Run Apify Actor ---
        actor_run = client.actor(INSTAGRAM_ACTOR_ID).call(run_input=run_input)
        print(f"API (Instagram): Apify actor call finished. Run details: {actor_run}")

        # --- Fetch Results ---
        print(f"API (Instagram): Fetching results from dataset {actor_run.get('defaultDatasetId', 'N/A')}...")
        # Check if actor run succeeded and has a dataset ID
        if not actor_run or 'defaultDatasetId' not in actor_run:
             return jsonify({"error": f"Actor run failed or did not produce a dataset. Run details: {actor_run}"}), 500

        dataset_id = actor_run["defaultDatasetId"]
        items_iterator = client.dataset(dataset_id).iterate_items()
        items_raw = list(items_iterator)
        print(f"API (Instagram): Fetched {len(items_raw)} items.")


        if not items_raw:
            print(f"API (Instagram): No items found for usernames: {', '.join(input_usernames)}")
            return jsonify({
                "message": f"Scraping completed, but no posts found for the given Instagram usernames ({', '.join(input_usernames)}).",
                "csvData": "", "jsonData": [], "filename": "", "jsonFilename": ""
            }), 200

        # --- Generate CSV ---
        print(f"API (Instagram): Generating CSV data...")
        output_buffer = io.StringIO()
        # Use fieldnames defined above, ensure they match actor output
        writer = csv.DictWriter(output_buffer, fieldnames=INSTAGRAM_CSV_FIELDNAMES, extrasaction='ignore', quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for item in items_raw:
            row_data = {field: clean_csv_value(item.get(field)) for field in INSTAGRAM_CSV_FIELDNAMES} # Pass None to get for default
            writer.writerow(row_data)
        csv_data_string = output_buffer.getvalue()
        output_buffer.close()

        # --- Prepare Response ---
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        first_username = input_usernames[0].replace(" ", "_").replace("/", "_") # Sanitize username
        base_filename = f"instagram_{first_username}_{timestamp}"
        csv_filename = f"{base_filename}.csv"
        json_filename = f"{base_filename}.json"

        print(f"API (Instagram): Successfully generated CSV data ({len(csv_data_string)} bytes).")

        return jsonify({
            "message": f"Successfully scraped {len(items_raw)} Instagram posts for {', '.join(input_usernames)}.",
            "csvData": csv_data_string,
            "jsonData": items_raw,
            "filename": csv_filename,
            "jsonFilename": json_filename
        }), 200

    except Exception as e:
        print(f"API Error (Instagram): An error occurred: {e}")
        traceback.print_exc()
        # Provide more specific error if possible
        error_message = str(e)
        if "max concurrency" in error_message.lower():
            error_message = "Apify plan limit reached (max concurrency). Please wait or upgrade your plan."
        elif "run aborted" in error_message.lower():
            error_message = "Apify actor run was aborted."

        return jsonify({"error": f"An internal server error occurred (Instagram): {type(e).__name__} - {error_message}"}), 500


# --- TikTok Endpoint (No changes) ---
@app.route('/api/scrape/tiktok', methods=['POST'])
def scrape_tiktok_api():
    client = initialize_apify_client()
    if not client: return jsonify({"error": "Server config error"}), 500
    data = request.get_json()
    if not data: return jsonify({"error": "No JSON body"}), 400
    hashtags_input = data.get('hashtags')
    try:
        results_per_page = int(data.get('resultsPerPage', 100))
        if results_per_page < 1: results_per_page = 1
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'resultsPerPage'"}), 400
    if not hashtags_input or not isinstance(hashtags_input, list):
        return jsonify({"error": "Invalid 'hashtags'"}), 400
    input_hashtags = [tag.strip() for tag in hashtags_input if isinstance(tag, str) and tag.strip()]
    if not input_hashtags: return jsonify({"error": "No valid hashtags"}), 400

    run_input = { "hashtags": input_hashtags, "resultsPerPage": results_per_page }
    print(f"API (TikTok): Starting scraper for hashtags: {', '.join(input_hashtags)} with limit {results_per_page}")
    print(f"API (TikTok): Actor ID: {TIKTOK_ACTOR_ID}")
    print(f"API (TikTok): Run Input: {run_input}")


    try:
        actor_run = client.actor(TIKTOK_ACTOR_ID).call(run_input=run_input)
        print(f"API (TikTok): Actor call finished. Run details: {actor_run}")

        if not actor_run or 'defaultDatasetId' not in actor_run:
             return jsonify({"error": f"TikTok Actor run failed or did not produce a dataset. Run details: {actor_run}"}), 500

        dataset_id = actor_run["defaultDatasetId"]
        items_iterator = client.dataset(dataset_id).iterate_items()
        items_raw = list(items_iterator)
        print(f"API (TikTok): Fetched {len(items_raw)} items.")

        if not items_raw:
             print(f"API (TikTok): No items found for hashtags: {', '.join(input_hashtags)}")
             return jsonify({"message": "No posts found for TikTok hashtags.", "csvData": "", "jsonData": [], "filename": "", "jsonFilename": ""}), 200

        print(f"API (TikTok): Generating CSV data...")
        output_buffer = io.StringIO()
        writer = csv.DictWriter(output_buffer, fieldnames=TIKTOK_CSV_FIELDNAMES, extrasaction='ignore', quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for item in items_raw:
            # Flattening logic for TikTok CSV
            row_data = {
                'authorName': clean_csv_value(item.get('authorMeta', {}).get('name', '')),
                'authorUsername': clean_csv_value(item.get('authorMeta', {}).get('nickName', item.get('authorMeta', {}).get('name', ''))),
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
                'hashtagInput': clean_csv_value(item.get('hashtagInput', ', '.join(input_hashtags)))
            }
            filtered_row = {k: v for k, v in row_data.items() if k in TIKTOK_CSV_FIELDNAMES}
            writer.writerow(filtered_row)
        csv_data_string = output_buffer.getvalue()
        output_buffer.close()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        first_hashtag = input_hashtags[0].replace(" ", "_").replace("/", "_")
        base_filename = f"tiktok_{first_hashtag}_{timestamp}"
        csv_filename = f"{base_filename}.csv"
        json_filename = f"{base_filename}.json"

        print(f"API (TikTok): Successfully generated CSV data ({len(csv_data_string)} bytes).")
        return jsonify({
            "message": f"Successfully scraped {len(items_raw)} TikTok posts for {', '.join(input_hashtags)}.",
            "csvData": csv_data_string, "jsonData": items_raw,
            "filename": csv_filename, "jsonFilename": json_filename
        }), 200

    except Exception as e:
        print(f"API Error (TikTok): An error occurred: {e}")
        traceback.print_exc()
        error_message = str(e)
        # Add specific error checks if needed
        return jsonify({"error": f"Internal server error (TikTok): {type(e).__name__} - {error_message}"}), 500


# --- Run Flask App ---
if __name__ == '__main__':
    # Use port 5001 or another if 5000 is taken by React dev server sometimes
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Flask server on http://0.0.0.0:{port}")
    # Set debug=False for production environments!
    app.run(debug=True, host='0.0.0.0', port=port)