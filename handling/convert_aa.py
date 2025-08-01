# /// script
# dependencies = ["requests", "orjson"]
# ///
import requests
import orjson
import os
import time


def transform_model_name(name):
    name = name.lower()

    # Hardcoded special cases
    if "reve image" in name or "halfmoon" in name:
        return "reve"
    if "imagen 3" in name and "v002" in name:
        return "imagen-3-generate-002"
    if "imagen 4 preview" in name:
        return "imagen-4-generate-preview"

    # Replace dots with hyphens in version numbers
    name = name.replace("x1", "x 1")
    name = name.replace("x.1", "x 1")

    # Handle bracketed suffixes
    name = name.replace("[pro]", "-pro")
    name = name.replace("[dev]", "-dev")
    name = name.replace("[max]", "-max")
    name = name.replace("[schnell]", "-schnell")

    # Handle parentheses
    name = name.replace("(beta)", "")
    name = name.replace("(standard)", "")

    # Replace 'v' followed by a number
    name = name.replace("v1", "1")
    name = name.replace("v2", "2")
    name = name.replace("v3", "3")
    name = name.replace("v6", "6")

    # Clean up .0s
    name = name.replace(".0", "")

    # Replace spaces with hyphens
    name = name.replace(" ", "-")

    # Clean up multiple hyphens
    while "--" in name:
        name = name.replace("--", "-")

    # Remove trailing hyphens
    name = name.rstrip("-")

    return name


def parse_ci95(ci95_str):
    """Parse CI95 string in format '-X/+Y' and return (low, high) offsets"""
    if not ci95_str:
        return None, None
    try:
        minus, plus = ci95_str.split("/")
        minus_val = float(minus.strip("-"))
        plus_val = float(plus.strip("+"))
        return minus_val, plus_val
    except:
        return None, None


# Fetch and transform the data
url = "https://artificialanalysis.ai/api/text-to-image/arena/preferences/total"
response = requests.get(url)
data = response.json()

# Load existing data from JSONL
slop = {}
slop_file_path = "src/routes/assets/data.jsonl"
if os.path.exists(slop_file_path):
    with open(slop_file_path, "r") as f:
        for line in f:
            model, modality, modality_data = orjson.loads(line)
            if model not in slop:
                slop[model] = {}
            slop[model][modality] = modality_data

timestamp = int(time.time())

# Extract and transform the data
for model in data["models"]:
    model_name = model.get("name", "")
    if not model_name:
        continue

    transformed_name = transform_model_name(model_name)

    if transformed_name not in slop:
        slop[transformed_name] = {}
    if "aa_image" in slop[transformed_name]:
        space = slop[transformed_name]["aa_image"]
    else:
        space = slop[transformed_name]["aa_image"] = {
            "first_seen": timestamp,
            "last_seen": 0,
            "data": {},
        }
    space["last_seen"] = timestamp
    try:
        del space["status"]
    except KeyError:
        pass

    # Iterate over all subsets in arena["total"]
    total_sections = model.get("arena", {}).get("total", {})
    for subset_key, subset_stats in total_sections.items():
        # Map 'total' to 'full' for compatibility
        subcat = "full" if subset_key == "total" else subset_key

        elo = subset_stats["elo"]

        # Parse and add confidence intervals
        minus_ci, plus_ci = parse_ci95(subset_stats.get("ci95"))
        def transform(x):
            x = round(x, 2)
            if isinstance(x, float) and x.is_integer():
                return int(x)
            return x
        if minus_ci is not None and plus_ci is not None:
            space["data"][subcat] = [
                transform(minus_ci),
                transform(elo),
                transform(plus_ci),
            ]
            continue
        space["data"][subcat] = [None, transform(elo), None]

for model in slop.values():
    if "aa_image" not in model:
        continue
    space = model["aa_image"]
    if space["last_seen"] != timestamp:
        space["status"] = "dead"

# Write directly to JSONL
with open(slop_file_path, "wb") as f:
    for model_name, model_data in slop.items():
        for modality, modality_data in model_data.items():
            f.write(orjson.dumps([model_name, modality, modality_data]) + b"\n")
