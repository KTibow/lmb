import openrouterRaw from "./assets/openrouter.jsonl?raw";

export interface ModelMetadata {
  deprecated?: boolean;
  isOpen?: boolean;
  organization?: string;
  // Original single price field (used for image generation models)
  price?: number;
  // OpenRouter fields
  openrouterSlug?: string;
  reasoningMultiplier?: number;
}

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export function getPriceRange(price: number | undefined): PriceRange | undefined {
  if (price === undefined) return undefined;
  if (price < 0.2) return "$";
  if (price < 1) return "$$";
  if (price < 10) return "$$$";
  return "$$$$";
}

export function getPriceRangeLabel(range: PriceRange): string {
  switch (range) {
    case "$":
      return "<$0.20";
    case "$$":
      return "$0.20-$1";
    case "$$$":
      return "$1-$10";
    case "$$$$":
      return "$10+";
  }
}

const mixPrice = (input: number, output: number) => (2 / 3) * input + (1 / 3) * output;

const openrouterData: [string, [number, number][]][] = openrouterRaw
  .split("\n")
  .map((x) => JSON.parse(x));
export function getPrice(modelName: string): number | undefined {
  const metadata = modelMetadata[modelName];
  if (!metadata) return undefined;

  if (metadata.price !== undefined) {
    return metadata.price;
  }

  // For OpenRouter models, calculate the optimal price from all available providers
  const openrouterSlug = metadata.openrouterSlug;
  const reasoningMultiplier = metadata.reasoningMultiplier || 1;
  if (openrouterSlug) {
    const providers = openrouterData.find((x) => x[0] == openrouterSlug)?.[1];
    if (!providers) {
      console.warn("No providers for", openrouterSlug);
      return undefined;
    }

    // Find the provider with the lowest mixed price based on our mixPrice formula
    let bestPrice = Number.MAX_VALUE;

    for (const [inputPrice, outputPrice] of providers) {
      const currentPrice = mixPrice(inputPrice, outputPrice * reasoningMultiplier);
      if (currentPrice < bestPrice) {
        bestPrice = currentPrice;
      }
    }

    if (bestPrice !== Number.MAX_VALUE) {
      return bestPrice;
    }
  }

  return undefined;
}

export const modelMetadata: Record<string, ModelMetadata> = {
  "amazon-nova-lite-v1.0": { organization: "Amazon", openrouterSlug: "amazon/nova-lite-v1" },
  "amazon-nova-micro-v1.0": { organization: "Amazon", openrouterSlug: "amazon/nova-micro-v1" },
  "amazon-nova-pro-v1.0": { organization: "Amazon", openrouterSlug: "amazon/nova-pro-v1" },
  "athene-70b-0725": { isOpen: true, organization: "NexusFlow" },
  "athene-v2-chat": { isOpen: true, organization: "NexusFlow" },
  "bard-jan-24-gemini-pro": { deprecated: true, organization: "Google" },
  "c4ai-aya-expanse-32b": {
    price: mixPrice(0.5, 1.5),
    isOpen: true,
    organization: "Cohere",
  },
  "c4ai-aya-expanse-8b": {
    price: mixPrice(0.5, 1.5),
    isOpen: true,
    organization: "Cohere",
  },
  "chatglm-6b": { isOpen: true },
  "chatglm2-6b": { isOpen: true },
  "chatglm3-6b": { isOpen: true },
  "chatgpt-4o-latest-20240808": { deprecated: true, organization: "OpenAI" },
  "chatgpt-4o-latest-20240903": { deprecated: true, organization: "OpenAI" },
  "chatgpt-4o-latest-20241120": {
    organization: "OpenAI",
    openrouterSlug: "openai/gpt-4o-2024-11-20",
  },
  "chatgpt-4o-latest-20250129": {
    deprecated: true,
    organization: "OpenAI",
  },
  "chatgpt-4o-latest-20250326": {
    organization: "OpenAI",
    openrouterSlug: "openai/chatgpt-4o-latest",
  },
  "claude-1": { organization: "Anthropic" },
  "claude-2.0": { organization: "Anthropic", openrouterSlug: "anthropic/claude-2.0" },
  "claude-2.1": { organization: "Anthropic", openrouterSlug: "anthropic/claude-2.1" },
  "claude-3-5-haiku-20241022": {
    organization: "Anthropic",
    openrouterSlug: "anthropic/claude-3.5-haiku-20241022",
  },
  "claude-3-5-sonnet-20240620": {
    organization: "Anthropic",
    openrouterSlug: "anthropic/claude-3.5-sonnet-20240620",
  },
  "claude-3-5-sonnet-20241022": {
    organization: "Anthropic",
    openrouterSlug: "anthropic/claude-3.5-sonnet",
  },
  "claude-3-7-sonnet-20250219": {
    organization: "Anthropic",
    openrouterSlug: "anthropic/claude-3.7-sonnet",
  },
  "claude-3-7-sonnet-20250219-thinking-32k": {
    organization: "Anthropic",
    openrouterSlug: "anthropic/claude-3.7-sonnet",
    reasoningMultiplier: 7.44,
  },
  "claude-3-haiku-20240307": {
    organization: "Anthropic",
    openrouterSlug: "anthropic/claude-3-haiku",
  },
  "claude-3-opus-20240229": {
    organization: "Anthropic",
    openrouterSlug: "anthropic/claude-3-opus",
  },
  "claude-3-sonnet-20240229": {
    organization: "Anthropic",
    openrouterSlug: "anthropic/claude-3-sonnet",
  },
  "claude-opus-4-20250514": {
    organization: "Anthropic",
    openrouterSlug: "anthropic/claude-opus-4",
  },
  "claude-sonnet-4-20250514": {
    organization: "Anthropic",
    openrouterSlug: "anthropic/claude-sonnet-4",
  },
  "claude-instant-1": { organization: "Anthropic" },
  "codellama-34b-instruct": { isOpen: true },
  "codellama-70b-instruct": { isOpen: true },
  "command-r": { isOpen: true, organization: "Cohere", openrouterSlug: "cohere/command-r" },
  "command-r-08-2024": {
    isOpen: true,
    organization: "Cohere",
    openrouterSlug: "cohere/command-r-08-2024",
  },
  "command-r-plus": {
    isOpen: true,
    organization: "Cohere",
    openrouterSlug: "cohere/command-r-plus",
  },
  "command-r-plus-08-2024": {
    isOpen: true,
    organization: "Cohere",
    openrouterSlug: "cohere/command-r-plus-08-2024",
  },
  "command-a-03-2025": {
    isOpen: true,
    organization: "Cohere",
    openrouterSlug: "cohere/command-a",
  },
  "dbrx-instruct-preview": { isOpen: true },
  "deepseek-coder-v2": { deprecated: true, isOpen: true, organization: "DeepSeek" },
  "deepseek-coder-v2-0724": { deprecated: true, isOpen: true, organization: "DeepSeek" },
  "deepseek-llm-67b-chat": { deprecated: true, isOpen: true, organization: "DeepSeek" },
  "deepseek-v2-api-0628": { deprecated: true, isOpen: true, organization: "DeepSeek" },
  "deepseek-v2.5": {
    price: mixPrice(0.14, 0.28),
    deprecated: true,
    isOpen: true,
    organization: "DeepSeek",
  },
  "deepseek-v2.5-1210": {
    price: mixPrice(0.14, 0.28),
    deprecated: true,
    isOpen: true,
    organization: "DeepSeek",
  },
  "deepseek-r1": {
    isOpen: true,
    organization: "DeepSeek",
    openrouterSlug: "deepseek/deepseek-r1",
    reasoningMultiplier: 5.7,
  },
  "deepseek-r1-0528": {
    isOpen: true,
    organization: "DeepSeek",
    openrouterSlug: "deepseek/deepseek-r1-0528",
    reasoningMultiplier: 4.2,
  },
  "deepseek-v3": {
    isOpen: true,
    organization: "DeepSeek",
    openrouterSlug: "deepseek/deepseek-chat",
  },
  "deepseek-v3-0324": {
    isOpen: true,
    organization: "DeepSeek",
    openrouterSlug: "deepseek/deepseek-chat-v3-0324",
  },
  "dolly-v2-12b": { isOpen: true },
  "falcon-180b-chat": { isOpen: true },
  "fastchat-t5-3b": { isOpen: true },
  "gemini-1.5-flash-001": { deprecated: true, organization: "Google" },
  "gemini-1.5-flash-002": {
    organization: "Google",
    openrouterSlug: "google/gemini-flash-1.5",
  },
  "gemini-1.5-flash-8b-001": {
    organization: "Google",
    openrouterSlug: "google/gemini-flash-1.5-8b",
  },
  "gemini-1.5-flash-8b-exp-0827": { deprecated: true, organization: "Google" },
  "gemini-1.5-flash-exp-0827": { deprecated: true, organization: "Google" },
  "gemini-1.5-pro-001": { deprecated: true, organization: "Google" },
  "gemini-1.5-pro-002": {
    organization: "Google",
    openrouterSlug: "google/gemini-pro-1.5",
  },
  "gemini-1.5-pro-api-0409-preview": {
    deprecated: true,
    organization: "Google",
  },
  "gemini-1.5-pro-exp-0801": { deprecated: true, organization: "Google" },
  "gemini-1.5-pro-exp-0827": { deprecated: true, organization: "Google" },
  "gemini-2.0-flash-001": {
    organization: "Google",
    openrouterSlug: "google/gemini-2.0-flash-001",
  },
  "gemini-2.0-flash-exp": { deprecated: true, organization: "Google" },
  "gemini-2.0-flash-thinking-exp-01-21": { deprecated: true, organization: "Google" },
  "gemini-2.0-flash-thinking-exp-1219": { deprecated: true, organization: "Google" },
  "gemini-2.0-pro-exp-02-05": { deprecated: true, organization: "Google" },
  "gemini-2.0-flash-lite-preview-02-05": {
    organization: "Google",
    openrouterSlug: "google/gemini-2.0-flash-lite-001",
  },
  "gemini-2.5-pro-exp-03-25": {
    organization: "Google",
    reasoningMultiplier: 2.9,
    deprecated: true,
  },
  "gemini-2.5-pro-preview-05-06": {
    organization: "Google",
    openrouterSlug: "google/gemini-2.5-pro-preview-05-06",
    reasoningMultiplier: 3.1,
    deprecated: true,
  },
  "gemini-2.5-pro": {
    organization: "Google",
    openrouterSlug: "google/gemini-2.5-pro",
    reasoningMultiplier: 3.1,
  },
  "gemini-2.5-flash-preview-04-17": {
    organization: "Google",
    openrouterSlug: "google/gemini-2.5-flash-preview",
    deprecated: true,
    reasoningMultiplier: 3.9,
  },
  "gemini-2.5-flash": {
    organization: "Google",
    openrouterSlug: "google/gemini-2.5-flash",
    reasoningMultiplier: 3.1,
  },
  "gemini-2.5-flash-lite-preview-06-17-thinking": {
    organization: "Google",
    openrouterSlug: "google/gemini-2.5-flash-lite-preview-06-17",
    // wait for dubesor
  },
  "gemini-advanced-0514": { deprecated: true, organization: "Google" },
  "gemini-exp-1114": { deprecated: true, organization: "Google" },
  "gemini-exp-1121": { deprecated: true, organization: "Google" },
  "gemini-exp-1206": { deprecated: true, organization: "Google" },
  "gemini-pro": { deprecated: true, organization: "Google" },
  "gemini-pro-dev-api": { deprecated: true, organization: "Google" },
  "gemma-1.1-2b-it": {
    deprecated: true,
    isOpen: true,
    organization: "Google Open",
  },
  "gemma-1.1-7b-it": {
    deprecated: true,
    isOpen: true,
    organization: "Google Open",
  },
  "gemma-2-27b-it": {
    isOpen: true,
    organization: "Google Open",
    openrouterSlug: "google/gemma-2-27b-it",
  },
  "gemma-2-2b-it": {
    deprecated: true,
    isOpen: true,
    organization: "Google Open",
  },
  "gemma-2-9b-it": {
    isOpen: true,
    organization: "Google Open",
    openrouterSlug: "google/gemma-2-9b-it",
  },
  "gemma-2-9b-it-simpo": { isOpen: true, organization: "Google Open" },
  "gemma-3-27b-it": {
    isOpen: true,
    organization: "Google Open",
    openrouterSlug: "google/gemma-3-27b-it",
  },
  "gemma-3-12b-it": {
    isOpen: true,
    organization: "Google Open",
    openrouterSlug: "google/gemma-3-12b-it",
  },
  "gemma-3-4b-it": {
    isOpen: true,
    organization: "Google Open",
    openrouterSlug: "google/gemma-3-4b-it",
  },
  "gemma-2b-it": {
    deprecated: true,
    isOpen: true,
    organization: "Google Open",
  },
  "gemma-7b-it": {
    deprecated: true,
    isOpen: true,
    organization: "Google Open",
  },
  "glm-4-0116": { organization: "Zhipu" },
  "glm-4-0520": { organization: "Zhipu" },
  "glm-4-plus": { organization: "Zhipu" },
  "gpt-3.5-turbo-0125": {
    organization: "OpenAI",
    openrouterSlug: "openai/gpt-3.5-turbo-0125",
  },
  "gpt-3.5-turbo-0314": { price: mixPrice(1.5, 2), organization: "OpenAI" },
  "gpt-3.5-turbo-0613": {
    organization: "OpenAI",
    openrouterSlug: "openai/gpt-3.5-turbo-0613",
  },
  "gpt-3.5-turbo-1106": { price: mixPrice(1, 2), organization: "OpenAI" },
  "gpt-4-0125-preview": { price: mixPrice(10, 30), organization: "OpenAI" },
  "gpt-4-0314": { price: mixPrice(30, 60), organization: "OpenAI" },
  "gpt-4-0613": { price: mixPrice(30, 60), organization: "OpenAI" },
  "gpt-4-1106-preview": { price: mixPrice(10, 30), organization: "OpenAI" },
  "gpt-4-turbo-2024-04-09": { price: mixPrice(10, 30), organization: "OpenAI" },
  "gpt-4o-2024-05-13": { price: mixPrice(5, 15), organization: "OpenAI" },
  "gpt-4o-2024-08-06": { price: mixPrice(2.5, 10), organization: "OpenAI" },
  "gpt-4o-mini-2024-07-18": { price: mixPrice(0.15, 0.6), organization: "OpenAI" },
  "gpt-4.1-2025-04-14": { organization: "OpenAI", openrouterSlug: "openai/gpt-4.1" },
  "gpt-4.1-mini-2025-04-14": { organization: "OpenAI", openrouterSlug: "openai/gpt-4.1-mini" },
  "gpt-4.1-nano-2025-04-14": { organization: "OpenAI", openrouterSlug: "openai/gpt-4.1-nano" },
  "gpt-4.5-preview-2025-02-27": {
    organization: "OpenAI",
    openrouterSlug: "openai/gpt-4.5-preview",
  },
  "gpt4all-13b-snoozy": { isOpen: true },
  "granite-3.0-2b-instruct": { isOpen: true },
  "granite-3.0-8b-instruct": { isOpen: true },
  "granite-3.1-2b-instruct": { isOpen: true },
  "granite-3.1-8b-instruct": { isOpen: true },
  "grok-2-2024-08-13": { organization: "xAI", openrouterSlug: "x-ai/grok-2-1212" },
  "grok-2-mini-2024-08-13": { organization: "xAI" },
  "early-grok-3": { deprecated: true, organization: "xAI" },
  "grok-3-preview-02-24": { organization: "xAI", openrouterSlug: "x-ai/grok-3-beta" },
  "grok-3-mini-beta": {
    organization: "xAI",
    openrouterSlug: "x-ai/grok-3-mini-beta",
    reasoningMultiplier: 2.5,
  },
  "guanaco-33b": { isOpen: true },
  "internlm2_5-20b-chat": { isOpen: true },
  "internvl2-26b": { isOpen: true },
  "internvl2-4b": { isOpen: true },
  "jamba-1.5-large": { isOpen: true, organization: "AI21" },
  "jamba-1.5-mini": { isOpen: true, organization: "AI21" },
  "koala-13b": { isOpen: true },
  "llama-13b": { deprecated: true, isOpen: true, organization: "Meta" },
  "tulu-2-dpo-70b": { deprecated: true, isOpen: true, organization: "Allen" },
  "llama-2-13b-chat": { deprecated: true, isOpen: true, organization: "Meta" },
  "llama-2-70b-chat": { deprecated: true, isOpen: true, organization: "Meta" },
  "llama-2-7b-chat": { deprecated: true, isOpen: true, organization: "Meta" },
  "llama-3-70b-instruct": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-3-70b-instruct",
  },
  "llama-3-8b-instruct": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-3-8b-instruct",
  },
  "llama-3.1-405b-instruct-bf16": {
    price: mixPrice(4, 4),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3.1-405b-instruct-fp8": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-3.1-405b-instruct",
  },
  "llama-3.1-70b-instruct": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-3.1-70b-instruct",
  },
  "llama-3.1-8b-instruct": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-3.1-8b-instruct",
  },
  "llama-3.1-tulu-3-70b": { isOpen: true, organization: "Allen" },
  "llama-3.1-tulu-3-8b": { isOpen: true, organization: "Allen" },
  "llama-3.1-nemotron-51b-instruct": { isOpen: true, organization: "NVIDIA" },
  "llama-3.1-nemotron-70b-instruct": {
    isOpen: true,
    organization: "NVIDIA",
    openrouterSlug: "nvidia/llama-3.1-nemotron-70b-instruct",
  },
  "llama-3.2-1b-instruct": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-3.2-1b-instruct",
  },
  "llama-3.2-3b-instruct": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-3.2-3b-instruct",
  },
  "llama-3.2-vision-11b-instruct": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-3.2-11b-vision-instruct",
  },
  "llama-3.2-vision-90b-instruct": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-3.2-90b-vision-instruct",
  },
  "llama-3.3-70b-instruct": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-3.3-70b-instruct",
  },
  "llama-3.3-nemotron-49b-super-v1": {
    isOpen: true,
    organization: "NVIDIA",
  },
  "llama-4-maverick-03-26-experimental": {
    deprecated: true,
    isOpen: true,
    organization: "Meta",
  },
  "llama-4-maverick-17b-128e-instruct": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-4-maverick",
  },
  "llama-4-scout-17b-16e-instruct": {
    isOpen: true,
    organization: "Meta",
    openrouterSlug: "meta-llama/llama-4-scout",
  },
  "llama2-70b-steerlm-chat": {
    deprecated: true,
    isOpen: true,
    organization: "NVIDIA",
  },
  "llava-v1.6-34b": { isOpen: true },
  "magistral-medium-2506": {
    organization: "Mistral",
    openrouterSlug: "mistralai/magistral-medium-2506",
    reasoningMultiplier: 8.8,
  },
  "minicpm-v-2_6": { isOpen: true },
  "minimax-m1": {
    isOpen: true,
    organization: "Minimax",
    openrouterSlug: "minimax/minimax-m1",
  },
  "ministral-8b-2410": {
    isOpen: true,
    organization: "Mistral",
    openrouterSlug: "mistralai/ministral-8b",
  },
  "mistral-7b-instruct": {
    isOpen: true,
    organization: "Mistral",
    openrouterSlug: "mistralai/mistral-7b-instruct",
  },
  "mistral-7b-instruct-v0.2": {
    isOpen: true,
    organization: "Mistral",
    openrouterSlug: "mistralai/mistral-7b-instruct-v0.2",
  },
  "mistral-large-2402": {
    organization: "Mistral",
    openrouterSlug: "mistralai/mistral-large",
  },
  "mistral-large-2407": {
    isOpen: true,
    organization: "Mistral",
    openrouterSlug: "mistralai/mistral-large-2407",
  },
  "mistral-large-2411": {
    isOpen: true,
    organization: "Mistral",
    openrouterSlug: "mistralai/mistral-large-2411",
  },
  "mistral-medium": {
    organization: "Mistral",
    openrouterSlug: "mistralai/mistral-medium",
  },
  "mistral-next": { organization: "Mistral" },
  "mistral-small-24b-instruct-2501": {
    isOpen: true,
    organization: "Mistral",
    openrouterSlug: "mistralai/mistral-small-24b-instruct-2501",
  },
  "mistral-small-3.1-24b-instruct-2503": {
    isOpen: true,
    organization: "Mistral",
    openrouterSlug: "mistralai/mistral-small-3.1-24b-instruct",
  },
  "mistral-medium-2505": {
    organization: "Mistral",
    openrouterSlug: "mistralai/mistral-medium-3",
  },
  "mixtral-8x22b-instruct-v0.1": {
    isOpen: true,
    organization: "Mistral",
    openrouterSlug: "mistralai/mixtral-8x22b-instruct",
  },
  "mixtral-8x7b-instruct-v0.1": {
    isOpen: true,
    organization: "Mistral",
    openrouterSlug: "mistralai/mixtral-8x7b-instruct",
  },
  "molmo-72b-0924": { isOpen: true, organization: "Allen" },
  "molmo-7b-d-0924": { isOpen: true, organization: "Allen" },
  "mpt-30b-chat": { isOpen: true },
  "mpt-7b-chat": { isOpen: true },
  "nemotron-4-340b-instruct": { isOpen: true, organization: "NVIDIA" },
  "nous-hermes-2-mixtral-8x7b-dpo": { isOpen: true },
  "o1-mini": { organization: "OpenAI", openrouterSlug: "openai/o1-mini", reasoningMultiplier: 2.1 },
  "o1-preview": {
    organization: "OpenAI",
    openrouterSlug: "openai/o1-preview",
    reasoningMultiplier: 4.3,
  },
  "o1-2024-12-17": {
    organization: "OpenAI",
    openrouterSlug: "openai/o1",
    reasoningMultiplier: 3.9,
  },
  "o3-2025-04-16": { organization: "OpenAI" }, // TODO: add price once Dubesor data is in
  "o3-mini": { organization: "OpenAI", openrouterSlug: "openai/o3-mini", reasoningMultiplier: 4.3 },
  "o3-mini-high": {
    organization: "OpenAI",
    openrouterSlug: "openai/o3-mini",
    reasoningMultiplier: 9.5,
  },
  "o4-mini-2025-04-16": {
    organization: "OpenAI",
    openrouterSlug: "openai/o4-mini",
    reasoningMultiplier: 3.5,
  },
  "oasst-pythia-12b": { isOpen: true },
  "olmo-7b-instruct": { isOpen: true },
  "openchat-3.5": { isOpen: true },
  "openchat-3.5-0106": { isOpen: true },
  "openhermes-2.5-mistral-7b": { isOpen: true },
  "palm-2": { organization: "Google" },
  "phi-3-medium-4k-instruct": { isOpen: true, organization: "Microsoft" },
  "phi-3-mini-128k-instruct": { isOpen: true, organization: "Microsoft" },
  "phi-3-mini-4k-instruct": { isOpen: true, organization: "Microsoft" },
  "phi-3-mini-4k-instruct-june-2024": {
    isOpen: true,
    organization: "Microsoft",
  },
  "phi-3-small-8k-instruct": { isOpen: true, organization: "Microsoft" },
  "phi-3-vision-128k-instruct": { isOpen: true, organization: "Microsoft" },
  "phi-3.5-vision-instruct": { isOpen: true, organization: "Microsoft" },
  "phi-4": { isOpen: true, organization: "Microsoft", openrouterSlug: "microsoft/phi-4" },
  "pixtral-12b-2409": {
    isOpen: true,
    organization: "Mistral",
    openrouterSlug: "mistralai/pixtral-12b",
  },
  "pixtral-large-2411": {
    isOpen: true,
    organization: "Mistral",
    openrouterSlug: "mistralai/pixtral-large-2411",
  },
  "qwen-14b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen-max-0428": { deprecated: true, organization: "Qwen" },
  "qwen-max-0919": { deprecated: true, organization: "Qwen" },
  "qwen-plus-0828": { deprecated: true, organization: "Qwen" },
  "qwen-plus-0125": { deprecated: true, organization: "Qwen" },
  "qwen-vl-max-1119": { organization: "Qwen" },
  "qwen1.5-110b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-14b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-32b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-4b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-72b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-7b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen2-72b-instruct": {
    isOpen: true,
    organization: "Qwen",
    openrouterSlug: "qwen/qwen-2-72b-instruct",
  },
  "qwen2-vl-72b": { isOpen: true, organization: "Qwen" },
  "qwen2-vl-7b-instruct": {
    isOpen: true,
    organization: "Qwen",
  },
  "qwen2.5-vl-72b-instruct": {
    isOpen: true,
    organization: "Qwen",
    openrouterSlug: "qwen/qwen2.5-vl-72b-instruct",
  },
  "qwen2.5-72b-instruct": {
    isOpen: true,
    organization: "Qwen",
    openrouterSlug: "qwen/qwen-2.5-72b-instruct",
  },
  "qwen2.5-coder-32b-instruct": {
    isOpen: true,
    organization: "Qwen",
    openrouterSlug: "qwen/qwen-2.5-coder-32b-instruct",
  },
  "qwen2.5-plus-1127": { deprecated: true, organization: "Qwen" },
  "qwen2.5-max": { deprecated: true, organization: "Qwen" },
  "qwen2.5-vl-32b-instruct": {
    isOpen: true,
    organization: "Qwen",
    openrouterSlug: "qwen/qwen2.5-vl-32b-instruct",
  },
  "qwen3-235b-a22b": {
    isOpen: true,
    organization: "Qwen",
    openrouterSlug: "qwen/qwen3-235b-a22b",
    reasoningMultiplier: 6.2,
  },
  "qwen3-235b-a22b-no-thinking": {
    isOpen: true,
    organization: "Qwen",
    openrouterSlug: "qwen/qwen3-235b-a22b",
  },
  "qwen3-32b": {
    isOpen: true,
    organization: "Qwen",
    openrouterSlug: "qwen/qwen3-32b",
    reasoningMultiplier: 6.2,
  },
  "qwen3-30b-a3b": {
    isOpen: true,
    organization: "Qwen",
    openrouterSlug: "qwen/qwen3-30b-a3b",
    reasoningMultiplier: 6.2,
  },
  "qwq-32b-preview": {
    isOpen: true,
    deprecated: true,
    organization: "Qwen",
    openrouterSlug: "qwen/qwq-32b-preview",
    reasoningMultiplier: 4,
  },
  "qwq-32b": {
    isOpen: true,
    organization: "Qwen",
    openrouterSlug: "qwen/qwq-32b",
    reasoningMultiplier: 7.71,
  },
  "reka-core-20240501": { deprecated: true, organization: "Reka AI" },
  "reka-core-20240722": { deprecated: true, organization: "Reka AI" },
  "reka-core-20240904": { organization: "Reka AI" },
  "reka-flash-20240722": { deprecated: true, organization: "Reka AI" },
  "reka-flash-20240904": { organization: "Reka AI" },
  "reka-flash-21b-20240226": { organization: "Reka AI" },
  "reka-flash-21b-20240226-online": { organization: "Reka AI" },
  "reka-flash-preview-20240611": { deprecated: true, organization: "Reka AI" },
  "RWKV-4-Raven-14B": { isOpen: true },
  "snowflake-arctic-instruct": { isOpen: true },
  "stablelm-tuned-alpha-7b": { isOpen: true },
  "starling-lm-7b-alpha": { isOpen: true },
  "starling-lm-7b-beta": { isOpen: true },
  "stripedhyena-nous-7b": { isOpen: true },
  "smollm2-1.7b-instruct": { isOpen: true },
  "vicuna-13b": { isOpen: true },
  "vicuna-33b": { isOpen: true },
  "vicuna-7b": { isOpen: true },
  "wizardlm-13b": { isOpen: true },
  "wizardlm-70b": { isOpen: true },
  "yi-1.5-34b-chat": { isOpen: true, organization: "01" },
  "yi-34b-chat": { isOpen: true, organization: "01" },
  "yi-large": { organization: "01", openrouterSlug: "01-ai/yi-large" },
  "yi-large-preview": { organization: "01" },
  "yi-lightning": { organization: "01" },
  "yi-lightning-lite": { organization: "01" },
  "zephyr-7b-alpha": { isOpen: true },
  "zephyr-7b-beta": { isOpen: true },
  "zephyr-orpo-141b-A35b-v0.1": { isOpen: true },
  "gpt-image-1": { price: 0.17, organization: "OpenAI" },
  "gpt-4o": { price: 0.17, organization: "OpenAI" },
  "seedream-3": { organization: "ByteDance" },
  "hidream-i1-dev": { price: 0.03, isOpen: true, organization: "HiDream" },
  "recraft-3": { price: 0.04, organization: "Recraft" },
  "imagen-3-generate-002": { price: 0.03, organization: "Google" },
  "imagen-4-generate-preview": { price: 0.04, organization: "Google" },
  "imagen-4-generate-preview-05-20": { price: 0.04, organization: "Google" },
  "imagen-4-ultra-experimental": { price: 0.06, organization: "Google" },
  reve: { price: 0.01, organization: "Reve" },
  "ideogram-3": { organization: "Ideogram" },
  "flux-1-kontext-max": { price: 0.08, organization: "Black Forest Labs" },
  "flux-1-kontext-pro": { price: 0.04, organization: "Black Forest Labs" },
  "flux-1.1-pro-ultra": { price: 0.06, organization: "Black Forest Labs" },
  "flux-1.1-pro": { price: 0.04, organization: "Black Forest Labs" },
  "flux-1-pro": { price: 0.05, organization: "Black Forest Labs" },
  "image-01": { price: 0.01, organization: "Minimax" },
  "flux-1-dev": { isOpen: true, price: 0.009, organization: "Black Forest Labs" },
  "ideogram-2": { price: 0.08, organization: "Ideogram" },
  "ideogram-2-turbo": { price: 0.05, organization: "Ideogram" },
  "stable-diffusion-3.5-large-turbo": { isOpen: true, organization: "Stability" },
  "luma-photon": { price: 0.019, organization: "Luma" },
  "stable-diffusion-3.5-large": { isOpen: true, price: 0.06, organization: "Stability" },
  "infinity-8b": { isOpen: true },
  "ideogram-1": { deprecated: true, organization: "Ideogram" },
  "stable-diffusion-3-large": { price: 0.065, organization: "Stability" },
  "stable-diffusion-3-large-turbo": { price: 0.04, organization: "Stability" },
  "stable-diffusion-3-medium": { price: 0.035, organization: "Stability" },
  "flux-1-schnell": { isOpen: true, price: 0.0005, organization: "Black Forest Labs" },
  "playground-3": { organization: "Playground" },
  "ideogram-2a": { price: 0.04, organization: "Ideogram" },
  "ideogram-2a-turbo": { price: 0.025, organization: "Ideogram" },
  "gemini-2-flash-preview": { organization: "Google", price: 0.039 },
  "gemini-2-flash-preview-image-generation": { organization: "Google", price: 0.039 },
  "gemini-2-flash-experimental": { organization: "Google", deprecated: true },
  "playground-2.5": { isOpen: true, organization: "Playground" },
  "dalle-3-hd": { price: 0.08, organization: "OpenAI" },
  "stable-diffusion-3.5-medium": { isOpen: true, price: 0.02, organization: "Stability" },
  "dalle-3": { price: 0.04, organization: "OpenAI" },
  "dalle-2": { deprecated: true, organization: "OpenAI" },
  "stable-diffusion-xl-1": { isOpen: true, price: 0.001, organization: "Stability" },
  "stable-diffusion-xl-turbo": { isOpen: true, price: 0.0002, organization: "Stability" },
  "janus-pro": { isOpen: true, price: 0.002, organization: "DeepSeek" },
} as const;
