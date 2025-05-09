# /// script
# dependencies = ["numpy", "pandas", "requests", "plotly==5.24.1", "ujson"]
# ///
import pickle
import ujson
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
        if match := re.match(r"elo_results_(\d{8})\.pkl", file["path"]):
            date_str = match.group(1)
            date = datetime.strptime(date_str, "%Y%m%d")
            pickle_files.append((date, file["path"]))

    if not pickle_files:
        raise Exception("No pickle files found in repository")

    # Get the most recent file
    pickle_files.sort(key=lambda x: x[0], reverse=True)
    latest_file = pickle_files[index][1]
    latest_id = latest_file.split("_")[2].split(".")[0]

    # Download the file content
    raw_url = f"https://huggingface.co/spaces/lmarena-ai/chatbot-arena-leaderboard/resolve/main/{latest_file}"
    response = requests.get(raw_url)
    response.raise_for_status()

    data = pickle.loads(response.content)
    timestamp = calendar.timegm(time.strptime(latest_id, "%Y%m%d"))
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


data, timestamp = get_latest_pickle_file(0)

# Load existing data from JSONL
slop = {}
slop_file_path = "src/routes/assets/data.jsonl"
if os.path.exists(slop_file_path):
    with open(slop_file_path, "r") as f:
        for line in f:
            model, modality, modality_data = ujson.loads(line)
            if model not in slop:
                slop[model] = {}
            slop[model][modality] = modality_data

# Process each category (text/vision)
for category_type, categories in data.items():
    # Process each subcategory (full, english, etc)
    for category_name, category_data in categories.items():
        if "elo_rating_final" not in category_data:
            print("skipping", category_name)
            continue
        if "bootstrap_df" not in category_data:
            print("skipping", category_name)
            continue

        # Process ratings and bootstrap data together
        df = category_data["bootstrap_df"]

        for model, elo in category_data["elo_rating_final"].items():
            transformed_name = (
                transform_model_name(model) if category_type == "image" else model
            )

            elo = float(elo)

            if transformed_name not in slop:
                slop[transformed_name] = {}
            space_name = f"lmarena_{category_type}"
            if space_name in slop[transformed_name]:
                space = slop[transformed_name][space_name]
            else:
                space = slop[transformed_name][space_name] = {
                    "first_seen": timestamp,
                    "last_seen": 0,
                    "data": {},
                }
            if timestamp > space["last_seen"]:
                space["last_seen"] = timestamp
                space["data"] = {}

            if model in df.columns:
                samples = df[model].astype(float).tolist()
                ci_low, ci_high = calculate_confidence_intervals(samples)
                if ci_low is not None and ci_high is not None:
                    space["data"][category_name] = [
                        round(elo - ci_low, 2),
                        round(elo, 2),
                        round(ci_high - elo, 2),
                    ]
                    continue
            space["data"][category_name] = [
                None,
                round(elo, 2),
                None,
            ]

for model in slop.values():
    for k in ["lmarena_text", "lmarena_vision", "lmarena_image"]:
        if k not in model:
            continue
        space = model[k]
        try:
            del space["dead"]
        except KeyError:
            pass
        if space["last_seen"] != timestamp:
            space["dead"] = True

# Write directly to JSONL
with open(slop_file_path, "w") as f:
    for model_name, model_data in slop.items():
        for modality, modality_data in model_data.items():
            f.write(ujson.dumps([model_name, modality, modality_data]) + "\n")
