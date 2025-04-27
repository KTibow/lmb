# /// script
# dependencies = ["numpy", "pandas", "requests", "plotly==5.24.1"]
# ///
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
import calendar

def get_latest_pickle_file(index):
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
    pickle_files.sort(key=lambda x: x[0], reverse=True)
    latest_file = pickle_files[index][1]
    latest_id = latest_file.split('_')[2].split('.')[0]

    # Download the file content
    raw_url = f"https://huggingface.co/spaces/lmarena-ai/chatbot-arena-leaderboard/resolve/main/{latest_file}"
    response = requests.get(raw_url)
    response.raise_for_status()

    data = pickle.loads(response.content)
    timestamp = calendar.timegm(time.strptime(latest_id, '%Y%m%d'))
    return data, timestamp

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

def transform_model_name(name):
    name = name.lower()
    if "photon" in name:
        name = f"luma-{name}"
    name = name.replace("v1", "1")
    name = name.replace("v2", "2")
    name = name.replace("v3", "3")
    name = name.replace("v6", "6")
    name = name.replace(".0", "")
    name = name.replace("-fp8", "")
    name = name.replace("35-large", "3.5-large")
    name = name.replace("dall-e", "dalle")
    return name

"""Convert pickle file to JSON, handling numpy and pandas objects."""
data, timestamp = get_latest_pickle_file(0)

processed_data = {}
all_models = {}

# Load existing dates file if it exists
models_file_path = 'src/routes/assets/all_models.json'
if os.path.exists(models_file_path):
    with open(models_file_path, 'r') as f:
        all_models = json.load(f)

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

        for model, elo in category_data['elo_rating_final'].items():
            transformed_name = transform_model_name(model) if category_type == "image" else model

            elo = float(elo)
            processed_data[category_type][category_name]['elo_rating_final'][transformed_name] = round(elo, 2)

            if transformed_name not in all_models:
                all_models[transformed_name] = {
                    "platform": "lmarena",
                    "first_seen": timestamp,
                    "last_seen": 0,
                    "elos": {}
                }
            all_models[transformed_name]["last_seen"] = timestamp
            all_models[transformed_name]["elos"][category_name] = round(elo)

            if model in df.columns:
                samples = df[model].astype(float).tolist()
                ci_low, ci_high = calculate_confidence_intervals(samples)
                if ci_low is not None and ci_high is not None:
                    processed_data[category_type][category_name]['confidence_intervals'][transformed_name] = {
                        'low': round(ci_low, 2),
                        'high': round(ci_high, 2)
                    }

for model in all_models.values():
    if model["platform"] != "lmarena":
        continue
    try:
        del model["dead"]
    except KeyError:
        pass
    if model["last_seen"] != timestamp:
        model["dead"] = True

with open('src/routes/assets/lmarena.json', 'w') as f:
    json.dump(processed_data, f, indent=2)

with open(models_file_path, 'w') as f:
    json.dump(all_models, f, indent=2)
