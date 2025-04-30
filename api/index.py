# api/index.py
import os
import csv
import io
import json
from datetime import datetime
from dotenv import load_dotenv
from apify_client import ApifyClient
# **** Import make_response ****
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import traceback

# Load environment variables
load_dotenv()
APIFY_TOKEN = os.getenv("APIFY_TOKEN")
# Use specific defaults or ensure they are set in Vercel env vars
INSTAGRAM_ACTOR_ID = os.getenv("INSTAGRAM_ACTOR_ID", "apify/instagram-scraper")
TIKTOK_ACTOR_ID = os.getenv("TIKTOK_ACTOR_ID", "clockworks/tiktok-scraper")
# FRONTEND_URLS = os.getenv("FRONTEND_URLS", "") # Keep if using specific origins below

# --- Flask App Setup ---
app = Flask(__name__)

# --- CORS Configuration ---
# Initialize CORS - this helps add headers to your *actual* POST responses
# Let's keep it simple with allow all for now to ensure it's not an origin mismatch issue
CORS(app)
# ------------------------

# --- Helper Functions & Configuration ---
if not APIFY_TOKEN:
    print("CRITICAL ERROR: APIFY_TOKEN environment variable not set.")

def initialize_apify_client():
    # ... (keep existing code) ...
    if not APIFY_TOKEN: print("Warning: APIFY_TOKEN is missing."); return None
    try: return ApifyClient(APIFY_TOKEN)
    except Exception as e: print(f"ERROR: Failed to initialize Apify Client: {e}"); return None

# --- Fieldnames for CSV ---
INSTAGRAM_CSV_FIELDNAMES = [
    'id', 'type', 'shortCode', 'caption', 'url', 'commentsCount', 'likesCount',
    'timestamp', 'ownerUsername', 'ownerId', 'ownerFullName',
    'displayUrl', 'videoUrl', 'videoViewCount', 'videoPlayCount', 'videoDuration',
    'alt', 'locationName', 'locationId', 'isSponsored',
    'hashtags', 'mentions', 'firstComment', 'inputUrl', 'error',
]
TIKTOK_CSV_FIELDNAMES = [
    'authorName', 'authorUsername', 'authorAvatar', 'text', 'diggCount',
    'shareCount', 'playCount', 'commentCount', 'collectCount',
    'videoDuration', 'musicName', 'musicAuthor', 'musicOriginal',
    'createTimeISO', 'webVideoUrl', 'hashtagInput'
]

def clean_csv_value(value): # Keep as is
    # ... (keep existing code) ...
    if value is None: return ''
    if isinstance(value, str):
        cleaned = value.replace('\r\n', ' ').replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
        return cleaned.strip()
    if isinstance(value, (list, dict)):
        try: return json.dumps(value, ensure_ascii=False)
        except TypeError: return str(value)
    return value

# --- Helper Function for Manual OPTIONS Preflight Response ---
def _build_cors_preflight_response():
    """Builds a response for a CORS preflight request (OPTIONS)."""
    response = make_response()
    # Crucially, set the Allow-Origin header. Use '*' for broad testing,
    # or restrict to your frontend origin(s) in production.
    response.headers.add("Access-Control-Allow-Origin", "*")
    # Specify allowed headers the frontend can send
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    # Specify allowed methods for the actual request
    response.headers.add('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT')
    # Allow credentials if your frontend sends them (e.g., cookies)
    # response.headers.add('Access-Control-Allow-Credentials', 'true')
    print("Built CORS preflight response") # Log when this is called
    return response


@app.route('/scrape/instagram', methods=['POST', 'OPTIONS'])
def scrape_instagram_api():
    if request.method == 'OPTIONS':
        print("Handling OPTIONS request for /scrape/instagram") # Log corrected path
        return _build_cors_preflight_response()

    print("Handling POST request for /scrape/instagram") # Log corrected path
    # --- Existing POST Logic (No changes needed inside here) ---
    client = initialize_apify_client(); # ... (rest of instagram logic) ...
    if not client: return jsonify({"error": "Server configuration error: Apify Client unavailable."}), 500
    data = request.get_json(); # ... (rest of validation) ...
    if not data: return jsonify({"error": "Invalid request: No JSON body found."}), 400
    usernames_input = data.get('usernames'); # ... (rest of username processing) ...
    try: results_limit = int(data.get('limit', 10)); assert results_limit >= 1
    except: return jsonify({"error": "Invalid 'limit' value."}), 400
    if not usernames_input or not isinstance(usernames_input, list): return jsonify({"error": "Invalid 'usernames' value."}), 400
    input_usernames = [n.strip() for n in usernames_input if isinstance(n, str) and n.strip()];
    if not input_usernames: return jsonify({"error": "No valid Instagram usernames provided."}), 400
    input_urls = [f"https://www.instagram.com/{username}/" for username in input_usernames]
    run_input = { "directUrls": input_urls, "resultsType": "posts", "resultsLimit": results_limit }
    print(f"API (Instagram): Starting scraper for URLs: {', '.join(input_urls)} with limit {results_limit}")
    print(f"API (Instagram): Actor ID: {INSTAGRAM_ACTOR_ID}")
    print(f"API (Instagram): Run Input: {json.dumps(run_input)}")
    try:
        actor_run = client.actor(INSTAGRAM_ACTOR_ID).call(run_input=run_input)
        print(f"API (Instagram): Apify actor call finished.")
        run_details = client.run(actor_run["id"]).get(); run_status = run_details.get('status')
        print(f"API (Instagram): Actor run status: {run_status}")
        if run_status != 'SUCCEEDED':
             print(f"ERROR: Instagram Actor run did not succeed. Status: {run_status}.")
             error_info = run_details.get('build', {}).get('error', {}).get('message', 'Unknown error during actor run.')
             return jsonify({"error": f"Instagram scraping failed. Actor status: {run_status}. Info: {error_info}"}), 500
        dataset_id = run_details.get("defaultDatasetId")
        if not dataset_id: return jsonify({"error": "Scraping finished but no dataset was produced."}), 500
        print(f"API (Instagram): Fetching results from dataset {dataset_id}...")
        items_raw = list(client.dataset(dataset_id).iterate_items())
        print(f"API (Instagram): Fetched {len(items_raw)} items.")
        if not items_raw: return jsonify({"message": f"No posts found.", "csvData": "", "jsonData": [], "filename": "", "jsonFilename": ""}), 200
        output_buffer = io.StringIO(); writer = csv.DictWriter(output_buffer, fieldnames=INSTAGRAM_CSV_FIELDNAMES, extrasaction='ignore'); writer.writeheader()
        for item in items_raw: writer.writerow({field: clean_csv_value(item.get(field, '')) for field in INSTAGRAM_CSV_FIELDNAMES})
        csv_data_string = output_buffer.getvalue(); output_buffer.close()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S"); first_username_safe = "".join(c if c.isalnum() or c in ('_', '-') else '_' for c in input_usernames[0])[:50]; base_filename = f"instagram_{first_username_safe}_{timestamp}"
        print(f"API (Instagram): Successfully generated CSV data.")
        return jsonify({"message": f"Successfully scraped {len(items_raw)} posts", "csvData": csv_data_string, "jsonData": items_raw, "filename": f"{base_filename}.csv", "jsonFilename": f"{base_filename}.json"}), 200
    except Exception as e:
        print(f"API Error (Instagram): An exception occurred: {e}"); traceback.print_exc(); error_message = str(e)
        if "max concurrency" in error_message.lower(): error_message = "Apify plan limit reached (max concurrency)."
        elif "run aborted" in error_message.lower(): error_message = "Apify actor run was aborted or timed out."
        elif "authentication failed" in error_message.lower(): error_message = "Apify authentication failed. Check API token."
        elif "not found" in error_message.lower() and INSTAGRAM_ACTOR_ID in error_message: error_message = f"Instagram Actor ({INSTAGRAM_ACTOR_ID}) not found."
        return jsonify({"error": f"An internal server error occurred (Instagram): {error_message}"}), 500


# ***** CORRECTED FLASK ROUTES *****
@app.route('/scrape/tiktok', methods=['POST', 'OPTIONS'])
def scrape_tiktok_api():
    if request.method == 'OPTIONS':
        print("Handling OPTIONS request for /scrape/tiktok") # Log corrected path
        return _build_cors_preflight_response()

    print("Handling POST request for /scrape/tiktok") # Log corrected path
    # --- Existing POST Logic (No changes needed inside here) ---
    client = initialize_apify_client(); # ... (rest of tiktok logic) ...
    if not client: return jsonify({"error": "Server configuration error: Apify Client unavailable."}), 500
    data = request.get_json(); # ... (rest of validation) ...
    if not data: return jsonify({"error": "No JSON body"}), 400
    hashtags_input = data.get('hashtags'); # ... (rest of hashtag processing) ...
    try: results_per_page = int(data.get('resultsPerPage', 100)); assert results_per_page >= 1
    except: return jsonify({"error": "Invalid 'resultsPerPage'"}), 400
    if not hashtags_input or not isinstance(hashtags_input, list): return jsonify({"error": "Invalid 'hashtags'"}), 400
    input_hashtags = [tag.strip() for tag in hashtags_input if isinstance(tag, str) and tag.strip()]
    if not input_hashtags: return jsonify({"error": "No valid hashtags"}), 400
    run_input = { "hashtags": input_hashtags, "resultsPerPage": results_per_page }
    print(f"API (TikTok): Starting scraper for hashtags: {', '.join(input_hashtags)} with limit {results_per_page}")
    print(f"API (TikTok): Actor ID: {TIKTOK_ACTOR_ID}")
    print(f"API (TikTok): Run Input: {json.dumps(run_input)}")
    try:
        actor_run = client.actor(TIKTOK_ACTOR_ID).call(run_input=run_input)
        print(f"API (TikTok): Actor call finished.")
        run_details = client.run(actor_run["id"]).get(); run_status = run_details.get('status')
        print(f"API (TikTok): Actor run status: {run_status}")
        if run_status != 'SUCCEEDED':
             print(f"ERROR: TikTok Actor run did not succeed. Status: {run_status}.")
             error_info = run_details.get('build', {}).get('error', {}).get('message', 'Unknown error during actor run.')
             return jsonify({"error": f"TikTok scraping failed. Actor status: {run_status}. Info: {error_info}"}), 500
        dataset_id = run_details.get("defaultDatasetId")
        if not dataset_id: return jsonify({"error": "Scraping finished but no dataset was produced."}), 500
        print(f"API (TikTok): Fetching results from dataset {dataset_id}...")
        items_raw = list(client.dataset(dataset_id).iterate_items())
        print(f"API (TikTok): Fetched {len(items_raw)} items.")
        if not items_raw: return jsonify({"message": "No posts found for TikTok hashtags.", "csvData": "", "jsonData": [], "filename": "", "jsonFilename": ""}), 200
        print(f"API (TikTok): Generating CSV data...")
        output_buffer = io.StringIO(); writer = csv.DictWriter(output_buffer, fieldnames=TIKTOK_CSV_FIELDNAMES, extrasaction='ignore'); writer.writeheader()
        for item in items_raw:
             row_data = { 'authorName': clean_csv_value(item.get('authorMeta', {}).get('name')), 'authorUsername': clean_csv_value(item.get('authorMeta', {}).get('nickName', item.get('authorMeta', {}).get('name'))), 'authorAvatar': clean_csv_value(item.get('authorMeta', {}).get('avatar')), 'text': clean_csv_value(item.get('text')), 'diggCount': item.get('diggCount', 0), 'shareCount': item.get('shareCount', 0), 'playCount': item.get('playCount', 0), 'commentCount': item.get('commentCount', 0), 'collectCount': item.get('collectCount', 0), 'videoDuration': item.get('videoMeta', {}).get('duration'), 'musicName': clean_csv_value(item.get('musicMeta', {}).get('musicName')), 'musicAuthor': clean_csv_value(item.get('musicMeta', {}).get('musicAuthor')), 'musicOriginal': item.get('musicMeta', {}).get('musicOriginal'), 'createTimeISO': clean_csv_value(item.get('createTimeISO')), 'webVideoUrl': clean_csv_value(item.get('webVideoUrl')), 'hashtagInput': clean_csv_value(item.get('hashtagInput', ', '.join(input_hashtags))) }
             filtered_row = {k: v for k, v in row_data.items() if k in TIKTOK_CSV_FIELDNAMES}; writer.writerow(filtered_row)
        csv_data_string = output_buffer.getvalue(); output_buffer.close()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S"); first_hashtag = input_hashtags[0].replace(" ", "_").replace("/", "_"); base_filename = f"tiktok_{first_hashtag}_{timestamp}"
        print(f"API (TikTok): Successfully generated CSV data.")
        return jsonify({"message": f"Successfully scraped {len(items_raw)} TikTok posts", "csvData": csv_data_string, "jsonData": items_raw, "filename": f"{base_filename}.csv", "jsonFilename": f"{base_filename}.json"}), 200
    except Exception as e:
        print(f"API Error (TikTok): An exception occurred: {e}"); traceback.print_exc(); error_message = str(e)
        return jsonify({"error": f"Internal server error (TikTok): {error_message}"}), 500


# --- (No app.run() needed for Vercel) ---

# Optional: Allow local execution via `python api/index.py`
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    print(f"[Local Dev] Starting Flask server on http://127.0.0.1:{port}")
    app.run(debug=True, host='127.0.0.1', port=port)