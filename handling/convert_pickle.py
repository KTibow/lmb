# /// script
# dependencies = ["numpy", "pandas", "requests", "plotly==5.24.1", "ujson"]
# ///
import pickle
import ujson
import numpy as np
import pandas as pd
import requests
from datetime import datetime
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

def process_model(name, paradigm, categories):
    transformed_name = (
        transform_model_name(name) if paradigm == "image" else name
    )
    if transformed_name not in slop:
        slop[transformed_name] = {}

    space_name = f"lmarena_{paradigm}"
    if space_name == "lmarena_text":
        space_name = "text"
    if space_name in slop[transformed_name]:
        space = slop[transformed_name][space_name]
    else:
        space = slop[transformed_name][space_name] = {
            "first_seen": timestamp,
            "last_seen": 0,
            "votes": 0,
            "data": {},
        }

    full_table = categories["full"]["leaderboard_table_df"]
    votes = full_table.loc[name]["num_battles"]

    is_update = timestamp > space["last_seen"]
    if is_update:
        try:
            del space["status"]
        except KeyError:
            pass

        old_votes = space["votes"] if "votes" in space else 0
        if is_update and old_votes == votes:
            space["status"] = "semidead"

        space["last_seen"] = timestamp
        space["votes"] = votes
        space["data"] = {}

    # Process all categories for this model
    for category_name, category_data in categories.items():
        leaderboard_df = category_data["leaderboard_table_df"]
        if name not in leaderboard_df.index:
            continue

        model_row = leaderboard_df.loc[name]
        elo = float(model_row["rating"])

        # Check if confidence interval columns exist
        ci_low = float(model_row["rating_q025"])
        ci_high = float(model_row["rating_q975"])
        space["data"][category_name] = [
            round(elo - ci_low, 2),
            round(elo, 2),
            round(ci_high - elo, 2),
        ]

# Process each category (text/vision)
for paradigm, categories in data.items():
    paradigm = paradigm.replace("-", "_")
    models_in_paradigm = set()
    for category_name, category_data in categories.items():
        for model in category_data["leaderboard_table_df"].index:
            models_in_paradigm.add(model)

    for model in models_in_paradigm:
        process_model(model, paradigm, categories)

for model in slop.values():
    for k in ["text", "lmarena_vision", "lmarena_image"]:
        if k not in model:
          continue
        space = model[k]
        if space["last_seen"] != timestamp:
            space["status"] = "dead"

# Write directly to JSONL
with open(slop_file_path, "w") as f:
    for model_name, model_data in slop.items():
        for modality, modality_data in model_data.items():
            f.write(ujson.dumps([model_name, modality, modality_data]) + "\n")
