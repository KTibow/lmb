import { launch, type LaunchOptions } from "jsr:@astral/astral";

const knownModelsJsonl = await Deno.readTextFile("src/routes/assets/data.jsonl");
const knownModels = knownModelsJsonl
  .split("\n")
  .filter(Boolean)
  .map((x) => JSON.parse(x))
  .map((x) => x[0]);
const boringModels = [
  "deepseek-r1-0528",
  "grok-3-mini-beta",
  "qwen3-235b-a22b-no-thinking",
  "claude-opus-4-20250514",
  "claude-sonnet-4-20250514",
  "glm-4-air-250414",
];

let astralArgs: LaunchOptions;
if (Deno.env.get("USER") == "kendell") {
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
await using browser = await launch(astralArgs);
await using page = await browser.newPage("https://lmarena.ai");
console.log("Loading LM Arena");

// @ts-ignore don't worry
const title: string = await page.evaluate(() => document.title);

if (title != "LMArena") {
  await page.waitForNetworkIdle({ idleTime: 2000 });
  const iframe = (await page.$("div > div > div"))!;
  const box = (await iframe.boundingBox())!;
  await page.mouse.click(box.x + 10, box.y + box.height / 2);
  await page.waitForNetworkIdle({ idleTime: 2000 });
}

const iframe = await page.$("#turnstile-container");
if (iframe) {
  await page.waitForNetworkIdle({ idleTime: 1000 });
  await page.evaluate(() => {
    // @ts-ignore don't worry
    document.cookie =
      "arena-auth-prod-v1=base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0ltdHBaQ0k2SWtOVFQwNHhkM05uU0hkRlNFTkNNbGNpTENKMGVYQWlPaUpLVjFRaWZRLmV5SnBjM01pT2lKb2RIUndjem92TDJoMWIyZDZiMlZ4ZW1OeVpIWnJkM1IyYjJScExuTjFjR0ZpWVhObExtTnZMMkYxZEdndmRqRWlMQ0p6ZFdJaU9pSXdNVFpqTldVME5TMHpPVGs1TFRRMFpqY3RPR1JtT0MwNU5EVmtZekF3WWpGbE1HWWlMQ0poZFdRaU9pSmhkWFJvWlc1MGFXTmhkR1ZrSWl3aVpYaHdJam94TnpRNE9ERTJPVFV3TENKcFlYUWlPakUzTkRnNE1UTXpOVEFzSW1WdFlXbHNJam9pSWl3aWNHaHZibVVpT2lJaUxDSmhjSEJmYldWMFlXUmhkR0VpT250OUxDSjFjMlZ5WDIxbGRHRmtZWFJoSWpwN0ltbGtJam9pWmpkak5tWTBZemd0TjJGbFppMDBNelkwTFRrd1lqa3RPVFkyWWpObU1URm1aVGsySW4wc0luSnZiR1VpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWVdGc0lqb2lZV0ZzTVNJc0ltRnRjaUk2VzNzaWJXVjBhRzlrSWpvaVlXNXZibmx0YjNWeklpd2lkR2x0WlhOMFlXMXdJam94TnpRNE9ERXpNelV3ZlYwc0luTmxjM05wYjI1ZmFXUWlPaUppWkRFME1UWXhPUzAxWWpVd0xUUTBNV0V0T1RBMk9TMDBNVFpsWkRCbU1EbGhOV01pTENKcGMxOWhibTl1ZVcxdmRYTWlPblJ5ZFdWOS5HVkh2U0FWTEdPNDZ6WlJXR0hfcS03cVI4LU9sQTZNOXRtMFBlMXRqVjJFIiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjE3NDg4MTY5NTAsInJlZnJlc2hfdG9rZW4iOiJtanUzaGJyYXZmeWEiLCJ1c2VyIjp7ImlkIjoiMDE2YzVlNDUtMzk5OS00NGY3LThkZjgtOTQ1ZGMwMGIxZTBmIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiIiLCJwaG9uZSI6IiIsImxhc3Rfc2lnbl9pbl9hdCI6IjIwMjUtMDYtMDFUMjE6Mjk6MTAuNDQxMTIyNDk0WiIsImFwcF9tZXRhZGF0YSI6e30sInVzZXJfbWV0YWRhdGEiOnsiaWQiOiJmN2M2ZjRjOC03YWVmLTQzNjQtOTBiOS05NjZiM2YxMWZlOTYifSwiaWRlbnRpdGllcyI6W10sImNyZWF0ZWRfYXQiOiIyMDI1LTA2LTAxVDIxOjI5OjEwLjQzOTYyM1oiLCJ1cGRhdGVkX2F0IjoiMjAyNS0wNi0wMVQyMToyOToxMC40NDI1NjlaIiwiaXNfYW5vbnltb3VzIjp0cnVlfX0";
    location.reload();
  });
  await page.waitForNavigation({ idleTime: 3000 });
}

console.log("Loaded");
const models: any[] = await page.evaluate(() => {
  // @ts-ignore don't worry
  const rsc = globalThis.__next_f.map((x) => x[1]).find((x) => x?.includes("claude"));
  if (!rsc) {
    // @ts-ignore don't worry
    console.error(globalThis.__next_f.map((x) => x[1]));
    return null;
  }

  const dataStart = rsc.slice(rsc.indexOf('{"initialState":'));
  let data;
  let trim = 0;
  while (!data && trim < 10) {
    try {
      data = JSON.parse(dataStart.slice(0, -trim)).initialState;
    } catch {
      trim++;
    }
  }
  return data;
});
if (!models) {
  throw new Error("no relevant rsc");
}
await browser.close();
let curiosities = models
  .filter((m) => m.capabilities.outputCapabilities.text)
  .filter((m) => !knownModels.includes(m.publicName))
  .filter((m) => !boringModels.includes(m.publicName))
  .map((m) => ({
    name: m.publicName,
    multimodal: Boolean(m.capabilities.inputCapabilities.image),
  }));
curiosities.sort((a, b) => a.name.localeCompare(b.name));
curiosities = curiosities.filter(
  ({ name }, i) => curiosities.findIndex((c) => c.name == name) == i,
);

const { messages }: { messages: { author: { name: string }; content: string }[] } = JSON.parse(
  await Deno.readTextFile("/tmp/chat.json"),
);
const getContext = (keyword: string) => {
  const contextSize = 5;

  // Find all indices where keyword appears
  const matchIndices = messages
    .map((msg, index) => (msg.content.toLowerCase().includes(keyword.toLowerCase()) ? index : -1))
    .filter((index) => index !== -1);

  if (matchIndices.length === 0) return [];

  // Create ranges for each match (including context)
  const ranges = matchIndices.map((index) => ({
    start: Math.max(0, index - contextSize),
    end: Math.min(messages.length - 1, index + contextSize),
  }));

  // Merge overlapping ranges
  const mergedRanges = ranges.reduce(
    (acc, current) => {
      if (acc.length === 0) return [current];

      const last = acc[acc.length - 1];
      if (current.start <= last.end + 1) {
        // Overlapping or adjacent - merge them
        last.end = Math.max(last.end, current.end);
        return acc;
      } else {
        // Non-overlapping - add as new range
        return [...acc, current];
      }
    },
    [] as Array<{ start: number; end: number }>,
  );

  // Extract messages from merged ranges
  return mergedRanges.flatMap((range) => messages.slice(range.start, range.end + 1));
};
const generate = async (payload: Record<string, any>) => {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("GEMINI_KEY")}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();
  return data.choices[0].message.content;
};

console.log("Summarizing buzz");
const contexts: Record<string, string> = {};
for (const { name } of curiosities) {
  const chat = getContext(name);
  const chatString = chat.map((m) => `${m.author.name}: ${m.content}`).join("\n");
  if (!chatString) continue;

  let context = await generate({
    model: "gemini-2.5-flash-preview-05-20",
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `<attachment>${chatString}</attachment> You're tracking anonymous models on the LM Arena leaderboard. Just write a short summary of the buzz around ${name}. You can use as much formatting as you'd like, but don't spam bullet points.`,
      },
    ],
  });
  context = context.replace(/^Here's a.+:\n/, "");
  contexts[name] = context;
}

await Deno.writeTextFile(
  "src/routes/anonymous/data.jsonl",
  curiosities
    .map((m) => ({ ...m, context: contexts[m.name] || "*none*" }))
    .map((m) => JSON.stringify(m))
    .join("\n"),
);
console.log("All done");
