import pickle
import json
import numpy as np
import pandas as pd
import requests
from datetime import datetime
import io
import re
import os
import time

def get_latest_pickle_file():
    """Fetch the latest pickle file from HuggingFace repository."""
    api_url = "https://huggingface.co/api/spaces/lmarena-ai/chatbot-arena-leaderboard/tree/main"

    response = requests.get(api_url)
    response.raise_for_status()
    files = response.json()

    # Filter for pickle files and extract dates
    pickle_files = []
    for file in files:
        if match := re.match(r'elo_results_(\d{8})\.pkl', file['path']):
            date_str = match.group(1)
            date = datetime.strptime(date_str, '%Y%m%d')
            pickle_files.append((date, file['path']))

    if not pickle_files:
        raise Exception("No pickle files found in repository")

    # Get the most recent file
    latest_file = max(pickle_files, key=lambda x: x[0])[1]

    # Download the file content
    raw_url = f"https://huggingface.co/spaces/lmarena-ai/chatbot-arena-leaderboard/resolve/main/{latest_file}"
    response = requests.get(raw_url)
    response.raise_for_status()

    return pickle.loads(response.content)

def convert_to_serializable(obj):
    """Convert numpy/pandas objects to JSON serializable types."""
    if isinstance(obj, (np.integer, np.floating)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return [convert_to_serializable(x) for x in obj.tolist()]
    elif isinstance(obj, (pd.DataFrame, pd.Series)):
        return convert_to_serializable(obj.to_dict())
    elif isinstance(obj, dict):
        return {str(k): convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_to_serializable(x) for x in obj]
    elif isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    return "..."

def calculate_confidence_intervals(samples):
    """Calculate 95% confidence intervals from bootstrap samples."""
    if not samples or len(samples) == 0:
        return None, None

    sorted_samples = sorted(samples)
    low_value = 0.5 * sorted_samples[2] + 0.5 * sorted_samples[3]
    high_value = 0.5 * sorted_samples[99 - 2] + 0.5 * sorted_samples[99 - 3]
    return low_value, high_value

"""Convert pickle file to JSON, handling numpy and pandas objects."""
data = get_latest_pickle_file()

processed_data = {}
model_dates = {}

# Load existing dates file if it exists
dates_file_path = 'src/routes/assets/dates.json'
if os.path.exists(dates_file_path):
    with open(dates_file_path, 'r') as f:
        model_dates = json.load(f)

current_time = int(time.time())

# Process each category (text/vision)
for category_type, categories in data.items():
    processed_data[category_type] = {}

    # Process each subcategory (full, english, etc)
    for category_name, category_data in categories.items():
        if 'elo_rating_final' not in category_data:
            print("skipping", category_name)
            continue
        if 'bootstrap_df' not in category_data:
            print("skipping", category_name)
            continue

        processed_data[category_type][category_name] = {
            'elo_rating_final': {},
            'confidence_intervals': {}
        }
        # print(category_data)

        # Process ratings and bootstrap data together
        df = category_data['bootstrap_df']

        for model, rating in category_data['elo_rating_final'].items():
            rating = float(rating)
            processed_data[category_type][category_name]['elo_rating_final'][model] = round(rating, 2)

            if model not in model_dates:
                model_dates[model] = current_time

            if model in df.columns:
                samples = df[model].astype(float).tolist()
                ci_low, ci_high = calculate_confidence_intervals(samples)
                if ci_low is not None and ci_high is not None:
                    processed_data[category_type][category_name]['confidence_intervals'][model] = {
                        'low': round(ci_low, 2),
                        'high': round(ci_high, 2)
                    }

with open('src/routes/assets/results.json', 'w') as f:
    json.dump(processed_data, f, indent=2)

with open(dates_file_path, 'w') as f:
    json.dump(model_dates, f, indent=2)
