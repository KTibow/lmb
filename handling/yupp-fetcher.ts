#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read --allow-env

import { launch } from "jsr:@astral/astral";

let astralArgs;
if (Deno.env.get("USER") === "kendell") {
  const wrapperPath = await Deno.makeTempFile();
  const wrapperScript = `#!/bin/bash
exec flatpak run org.chromium.Chromium "$@"
`;

  await Deno.writeTextFile(wrapperPath, wrapperScript);
  await Deno.chmod(wrapperPath, 0o755);

  astralArgs = {
    path: wrapperPath,
    headless: false,
  };
} else {
  astralArgs = {
    args: ["--no-sandbox"],
  };
}

type YuppModel = {
  model_info: {
    taxonomy_label: string;
  };
  model_rating: {
    rating: number;
    rating_lower: number;
    rating_upper: number;
  };
};
const getLeaderboard = async (): Promise<YuppModel[]> => {
  await using browser = await launch(astralArgs);
  await using page = await browser.newPage("https://yupp.ai");

  return await page.evaluate(async () => {
    const YUPP_API_URL =
      "https://yupp.ai/api/trpc/leaderboard.getLeaderboard?input=%7B%22json%22%3A%7B%22offset%22%3A0%2C%22numResults%22%3A100%7D%7D";

    const response = await fetch(YUPP_API_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return data.result.data.json.models;
  });
};
const leaderboard = await getLeaderboard();

// Explicit mapping of Yupp model names to LMB model names
const renames: Record<string, string> = {
  "Claude Opus 4": "claude-opus-4-20250514",
  "Claude Sonnet 3.7 (Thinking)": "claude-3-7-sonnet-20250219-thinking-32k",
  "Claude Sonnet 3.7": "claude-3-7-sonnet-20250219",
  "Claude Sonnet 4 (Thinking)": "claude-sonnet-4-20250514-thinking",
  "Claude Sonnet 4": "claude-sonnet-4-20250514",
  "Gemini 2.5 Flash Preview Thinking": "gemini-2.5-flash",
  "Gemini 2.5 Flash Preview": "gemini-2.5-flash-no-thinking",
  "Grok 3": "grok-3-preview-02-24",
  "Grok 4": "grok-4-0709",
  "OpenAI Codex Mini": "codex-mini",
  "OpenAI o3": "o3-2025-04-16",
  "OpenAI o3-mini": "o3-mini",
  "OpenAI o3-pro": "o3-pro",
  "Qwen 3 14B": "qwen3-14b",
  "Qwen 3 4B": "qwen3-4b",
  "Qwen 3 8B": "qwen3-8b",
};

// Models to include with their calibration references
const includedModels: Record<
  string,
  {
    calibrate: (oldData: Record<string, number>, newData: Record<string, number>) => number;
  }
> = {
  // "claude-sonnet-4-20250514-thinking": {
  //   calibrate: (oldData, newData) => {
  //     const diffMultiplier =
  //       (newData["claude-3-7-sonnet-20250219-thinking-32k"] -
  //         newData["claude-3-7-sonnet-20250219"]) /
  //       (oldData["claude-3-7-sonnet-20250219-thinking-32k"] -
  //         oldData["claude-3-7-sonnet-20250219"]);
  //     const diff =
  //       (oldData["claude-sonnet-4-20250514-thinking"] - oldData["claude-sonnet-4-20250514"]) *
  //       diffMultiplier;
  //     return newData["claude-sonnet-4-20250514"] + diff;
  //   },
  // },
  "gemini-2.5-flash-no-thinking": {
    calibrate: (oldData, newData) => {
      const diff = oldData["gemini-2.5-flash-no-thinking"] - oldData["gemini-2.5-flash"];
      return diff + newData["gemini-2.5-flash"];
    },
  },
  // "grok-4-0709": {
  //   calibrate: (oldData, newData) => {
  //     const diff = oldData["grok-4-0709"] - oldData["grok-3-preview-02-24"];
  //     return diff + newData["grok-3-preview-02-24"];
  //   },
  // },
  "o3-pro": {
    calibrate: (oldData, newData) => {
      const diff = oldData["o3-pro"] - oldData["o3-2025-04-16"];
      return diff + newData["o3-2025-04-16"];
    },
  },
};

// Load existing LM Arena data for calibration
const slop: Array<[string, string, any]> = [];
const dataFilePath = "./src/routes/assets/data.jsonl";

try {
  const existingContent = await Deno.readTextFile(dataFilePath);
  for (const line of existingContent.split("\n").filter(Boolean)) {
    const parsed = JSON.parse(line);
    slop.push(parsed);
  }
  console.log(`Loaded ${slop.length} existing models for calibration`);
} catch (error) {
  console.log("No existing data file found, using fallback calibration");
}

// Helper to find an entry in existingData by name and paradigm
function findExistingModel(
  name: string,
  paradigm: string,
): { name: string; paradigm: string; modelData: any } | undefined {
  for (const entry of slop) {
    if (entry[0] === name && entry[1] === paradigm) {
      return { name: entry[0], paradigm: entry[1], modelData: entry[2] };
    }
  }
  return undefined;
}

// Process yupp models
const timestamp = Math.floor(Date.now() / 1000);
const processedModels: Array<[string, string, any]> = [];

console.log(`Processing ${leaderboard.length} models from Yupp...`);

for (const model of leaderboard) {
  const yuppName = model.model_info.taxonomy_label;
  const lmbName = renames[yuppName];

  if (!lmbName || !includedModels[lmbName]) {
    continue;
  }

  const { calibrate } = includedModels[lmbName];
  const calibrateCategory = (category: string) => {
    const oldDataBounds = Object.fromEntries(
      leaderboard
        .filter((x) => x.model_info.taxonomy_label in renames)
        .map((x) => [renames[x.model_info.taxonomy_label], x.model_rating]),
    );
    const [oldDataLower, oldData, oldDataUpper] = (
      [(x) => x.rating_lower, (x) => x.rating, (x) => x.rating_upper] as Array<
        (x: { rating: number; rating_lower: number; rating_upper: number }) => number
      >
    ).map((f) =>
      Object.fromEntries(Object.entries(oldDataBounds).map(([name, value]) => [name, f(value)])),
    );
    const newDataBounds = Object.fromEntries(
      slop
        .filter((x) => x[1] == "text")
        .filter((x) => category in x[2].data)
        .map((x) => [x[0], x[2].data[category]]),
    );
    const [newDataLower, newData, newDataUpper] = (
      [(x) => x[1] - x[0], (x) => x[1], (x) => x[1] + x[2]] as Array<
        (x: [number, number, number]) => number
      >
    ).map((f) =>
      Object.fromEntries(Object.entries(newDataBounds).map(([name, value]) => [name, f(value)])),
    );

    const calibratedRating = calibrate(oldData, newData);
    const calibratedLower = calibratedRating - calibrate(oldDataLower, newDataLower);
    const calibratedUpper = calibrate(oldDataUpper, newDataUpper) - calibratedRating;
    const transform = (x: number) => Math.round(x * 100) / 100;
    return [transform(calibratedLower), transform(calibratedRating), transform(calibratedUpper)];
  };

  const paradigm = "text";
  const existing = findExistingModel(lmbName, paradigm);
  processedModels.push([
    lmbName,
    paradigm,
    {
      first_seen: existing?.modelData?.first_seen || timestamp,
      last_seen: timestamp,
      data: {
        full: calibrateCategory("full"),
        full_style_control: calibrateCategory("full_style_control"),
      },
      is_yupp: true,
    },
  ]);
  console.log(`Processed: ${yuppName} (${model.model_rating.rating.toFixed(1)}) -> ${lmbName}`);
}

// Update existing data with yupp models
for (const [name, paradigm, modelData] of processedModels) {
  // Remove any existing entry with the same name and paradigm
  const idx = slop.findIndex((entry) => entry[0] === name && entry[1] === paradigm);
  if (idx !== -1) {
    slop[idx] = [name, paradigm, modelData];
  } else {
    slop.push([name, paradigm, modelData]);
  }
}

await Deno.writeTextFile(dataFilePath, slop.map((x) => JSON.stringify(x)).join("\n") + "\n");

console.log(`\nSuccessfully added ${processedModels.length} yupp models to leaderboard`);
