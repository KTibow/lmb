import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Configuration
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const METADATA_PATH = path.resolve(PROJECT_ROOT, "src", "routes", "model-metadata.ts");
const OUTPUT_PATH = path.resolve(PROJECT_ROOT, "src", "routes", "assets", "openrouter.jsonl");

function getAllPricing(endpoints) {
  if (!endpoints?.length) return null;

  const prices = endpoints
    .map((endpoint) => endpoint.pricing)
    .filter(Boolean)
    .map(({ prompt, completion }) => {
      return [parseFloat(prompt) * 1_000_000, parseFloat(completion) * 1_000_000];
    })
    .map(([prompt, completion]) => [+prompt.toFixed(4), +completion.toFixed(4)]);

  return prices.length ? prices : null;
}

async function extractModelMetadata() {
  const data = await fs.readFile(METADATA_PATH, "utf8");
  const slugs = new Set();

  const slugRegex = /openrouterSlug\s*:\s*"([^"]+)"/g;

  for (let match; (match = slugRegex.exec(data)) !== null; ) {
    const [, openrouterSlug] = match;
    slugs.add(openrouterSlug);
  }

  return [...slugs];
}

// Main script
console.log("Updating OpenRouter prices...");
const slugs = await extractModelMetadata();
let result = [];

const work = async () => {
  while (true) {
    const openrouterSlug = slugs.shift();
    if (!openrouterSlug) return;

    const endpointUrl = `https://openrouter.ai/api/v1/models/${openrouterSlug}/endpoints`;

    const response = await fetch(endpointUrl);
    const { data } = await response.json();

    const prices = getAllPricing(data?.endpoints);
    result.push([openrouterSlug, prices]);
  }
};

await Promise.all([work(), work(), work(), work(), work()]);

result.sort((a, b) => a[0].localeCompare(b[0]));

await fs.writeFile(OUTPUT_PATH, result.map(JSON.stringify).join("\n"));
console.log(`Done. Saved ${Object.keys(result).length} models.`);
