import requests
import json
import os
import time

def transform_model_name(name):
    name = name.lower()

    # Hardcoded special cases
    if "reve image" in name or "halfmoon" in name:
        return "reve"
    if "imagen 3" in name and "v002" in name:
        return "imagen-3-generate-002"

    # Replace dots with hyphens in version numbers
    name = name.replace("x1", "x 1")
    name = name.replace("x.1", "x 1")

    # Handle bracketed suffixes
    name = name.replace("[pro]", "-pro")
    name = name.replace("[dev]", "-dev")
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
        minus, plus = ci95_str.split('/')
        minus_val = float(minus.strip('-'))
        plus_val = float(plus.strip('+'))
        return minus_val, plus_val
    except:
        return None, None

# Fetch and transform the data
url = "https://artificialanalysis.ai/api/text-to-image/arena/preferences/total"
response = requests.get(url)
data = response.json()

# Initialize the output structure
output = {}

model_dates = {}

dates_file_path = 'src/routes/assets/dates.json'
if os.path.exists(dates_file_path):
    with open(dates_file_path, 'r') as f:
        model_dates = json.load(f)

current_time = int(time.time())

# Extract and transform the data
for result in data:
    model_name = result.get("name", "")
    if not model_name:
        continue

    if model_name not in model_dates:
        model_dates[model_name] = current_time

    transformed_name = transform_model_name(model_name)
    categories = result.get("categories")

    # Iterate over all subsets in arena["total"]
    total_sections = result.get("arena", {}).get("total", {})
    for subset_key, subset_stats in total_sections.items():
        # Map 'total' to 'full' for compatibility
        subcat = "full" if subset_key == "total" else subset_key

        elo_rating = subset_stats["elo"]

        # Initialize subcategory dicts if missing
        if subcat not in output:
            output[subcat] = {
                "elo_rating_final": {},
                "confidence_intervals": {},
                "categories": {}
            }

        output[subcat]["elo_rating_final"][transformed_name] = round(elo_rating, 2)

        # Parse and add confidence intervals
        minus_ci, plus_ci = parse_ci95(subset_stats.get("ci95"))
        if minus_ci is not None and plus_ci is not None:
            output[subcat]["confidence_intervals"][transformed_name] = {
                "low": round(elo_rating - minus_ci, 2),
                "high": round(elo_rating + plus_ci, 2)
            }

        # Add categories list (same for all subsets)
        output[subcat]["categories"][transformed_name] = categories

# Ensure directory exists
os.makedirs("src/routes/assets", exist_ok=True)

# Write to file
with open("src/routes/assets/image_artificial.json", "w") as f:
    json.dump(output, f, indent=2)

with open(dates_file_path, 'w') as f:
    json.dump(model_dates, f, indent=2)
