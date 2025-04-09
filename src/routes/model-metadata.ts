export interface ModelMetadata {
  deprecated?: boolean;
  isOpen?: boolean;
  organization?: string;
  price?: number;
}

export type FilterStrategy = "showAll" | "hideDeprecated" | "hideOld" | "onePerOrg";
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

export function getFilterDescription(strategy: FilterStrategy): string {
  switch (strategy) {
    case "showAll":
      return "Never";
    case "hideDeprecated":
      return "Drop deprecated";
    case "hideOld":
      return "Drop old";
    case "onePerOrg":
      return "Best / org";
  }
}

const mixPrice = (input: number, output: number) => (2 / 3) * input + (1 / 3) * output;

export const modelMetadata: Record<string, ModelMetadata> = {
  "amazon-nova-lite-v1.0": { price: mixPrice(0.06, 0.24), organization: "Amazon" },
  "amazon-nova-micro-v1.0": { price: mixPrice(0.035, 0.14), organization: "Amazon" },
  "amazon-nova-pro-v1.0": { price: mixPrice(0.8, 3.2), organization: "Amazon" },
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
  "chatgpt-4o-latest-20241120": { price: mixPrice(2.5, 10), organization: "OpenAI" },
  "chatgpt-4o-latest-20250129": {
    deprecated: true,
    price: mixPrice(5, 15),
    organization: "OpenAI",
  },
  "chatgpt-4o-latest-20250326": { price: mixPrice(5, 15), organization: "OpenAI" },
  "claude-1": { organization: "Anthropic" },
  "claude-2.0": { price: mixPrice(8, 24), organization: "Anthropic" },
  "claude-2.1": { price: mixPrice(8, 24), organization: "Anthropic" },
  "claude-3-5-haiku-20241022": {
    price: mixPrice(0.8, 4),
    organization: "Anthropic",
  },
  "claude-3-5-sonnet-20240620": {
    price: mixPrice(3, 15),
    organization: "Anthropic",
  },
  "claude-3-5-sonnet-20241022": {
    price: mixPrice(3, 15),
    organization: "Anthropic",
  },
  "claude-3-7-sonnet-20250219": {
    price: mixPrice(3, 15),
    organization: "Anthropic",
  },
  "claude-3-7-sonnet-20250219-thinking-32k": {
    price: mixPrice(3, 15 * 7.44),
    organization: "Anthropic",
  },
  "claude-3-haiku-20240307": {
    price: mixPrice(0.25, 1.25),
    organization: "Anthropic",
  },
  "claude-3-opus-20240229": { price: mixPrice(15, 75), organization: "Anthropic" },
  "claude-3-sonnet-20240229": { price: mixPrice(3, 15), organization: "Anthropic" },
  "claude-instant-1": { organization: "Anthropic" },
  "codellama-34b-instruct": { isOpen: true },
  "codellama-70b-instruct": { isOpen: true },
  "command-r": { price: mixPrice(0.5, 1.5), isOpen: true, organization: "Cohere" },
  "command-r-08-2024": {
    price: mixPrice(0.15, 0.6),
    isOpen: true,
    organization: "Cohere",
  },
  "command-r-plus": {
    price: mixPrice(3, 15),
    isOpen: true,
    organization: "Cohere",
  },
  "command-r-plus-08-2024": {
    price: mixPrice(2.5, 10),
    isOpen: true,
    organization: "Cohere",
  },
  "command-a-03-2025": {
    price: mixPrice(2.5, 10),
    isOpen: true,
    organization: "Cohere",
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
  "deepseek-r1": { price: mixPrice(0.55, 2.19 * 5.7), isOpen: true, organization: "DeepSeek" },
  "deepseek-v3": { price: mixPrice(0.27, 1.1), isOpen: true, organization: "DeepSeek" },
  "deepseek-v3-0324": { price: mixPrice(0.27, 1.1), isOpen: true, organization: "DeepSeek" },
  "dolly-v2-12b": { isOpen: true },
  "falcon-180b-chat": { isOpen: true },
  "fastchat-t5-3b": { isOpen: true },
  "gemini-1.5-flash-001": { deprecated: true, organization: "Google" },
  "gemini-1.5-flash-002": { price: mixPrice(0.075, 0.3), organization: "Google" },
  "gemini-1.5-flash-8b-001": {
    price: mixPrice(0.0375, 0.15),
    organization: "Google",
  },
  "gemini-1.5-flash-8b-exp-0827": { deprecated: true, organization: "Google" },
  "gemini-1.5-flash-exp-0827": { deprecated: true, organization: "Google" },
  "gemini-1.5-pro-001": { deprecated: true, organization: "Google" },
  "gemini-1.5-pro-002": { price: mixPrice(1.25, 5), organization: "Google" },
  "gemini-1.5-pro-api-0409-preview": {
    deprecated: true,
    organization: "Google",
  },
  "gemini-1.5-pro-exp-0801": { deprecated: true, organization: "Google" },
  "gemini-1.5-pro-exp-0827": { deprecated: true, organization: "Google" },
  "gemini-2.0-flash-001": { price: mixPrice(0.1, 0.4), organization: "Google" },
  "gemini-2.0-flash-exp": { deprecated: true, organization: "Google" },
  "gemini-2.0-flash-thinking-exp-01-21": { organization: "Google" },
  "gemini-2.0-flash-thinking-exp-1219": { deprecated: true, organization: "Google" },
  "gemini-2.0-pro-exp-02-05": { deprecated: true, organization: "Google" },
  "gemini-2.0-flash-lite-preview-02-05": { price: mixPrice(0.075, 0.3), organization: "Google" },
  "gemini-2.5-pro-exp-03-25": { price: mixPrice(1.25, 10 * 2.9), organization: "Google" },
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
    price: mixPrice(0.27, 0.27),
    isOpen: true,
    organization: "Google Open",
  },
  "gemma-2-2b-it": { isOpen: true, organization: "Google Open" },
  "gemma-2-9b-it": {
    price: mixPrice(0.03, 0.06),
    isOpen: true,
    organization: "Google Open",
  },
  "gemma-2-9b-it-simpo": { isOpen: true, organization: "Google Open" },
  "gemma-3-27b-it": { isOpen: true, price: mixPrice(0.1, 0.2), organization: "Google Open" },
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
  "gpt-3.5-turbo-0125": { price: mixPrice(0.5, 1.5), organization: "OpenAI" },
  "gpt-3.5-turbo-0314": { price: mixPrice(1.5, 2), organization: "OpenAI" },
  "gpt-3.5-turbo-0613": { price: mixPrice(1.5, 2), organization: "OpenAI" },
  "gpt-3.5-turbo-1106": { price: mixPrice(1, 2), organization: "OpenAI" },
  "gpt-4-0125-preview": { price: mixPrice(10, 30), organization: "OpenAI" },
  "gpt-4-0314": { price: mixPrice(30, 60), organization: "OpenAI" },
  "gpt-4-0613": { price: mixPrice(30, 60), organization: "OpenAI" },
  "gpt-4-1106-preview": { price: mixPrice(10, 30), organization: "OpenAI" },
  "gpt-4-turbo-2024-04-09": { price: mixPrice(10, 30), organization: "OpenAI" },
  "gpt-4o-2024-05-13": { price: mixPrice(5, 15), organization: "OpenAI" },
  "gpt-4o-2024-08-06": { price: mixPrice(2.5, 10), organization: "OpenAI" },
  "gpt-4o-mini-2024-07-18": { price: mixPrice(0.15, 0.6), organization: "OpenAI" },
  "gpt-4.5-preview-2025-02-27": { price: mixPrice(75, 150), organization: "OpenAI" },
  "gpt4all-13b-snoozy": { isOpen: true },
  "granite-3.0-2b-instruct": { isOpen: true },
  "granite-3.0-8b-instruct": { isOpen: true },
  "granite-3.1-2b-instruct": { isOpen: true },
  "granite-3.1-8b-instruct": { isOpen: true },
  "grok-2-2024-08-13": { price: mixPrice(2, 10), organization: "xAI" },
  "grok-2-mini-2024-08-13": { organization: "xAI" },
  "early-grok-3": { deprecated: true, organization: "xAI" },
  "grok-3-preview-02-24": { price: mixPrice(3, 15), organization: "xAI" },
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
    price: mixPrice(0.23, 0.4),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3-8b-instruct": {
    price: mixPrice(0.03, 0.06),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3.1-405b-instruct-bf16": {
    price: mixPrice(3, 3),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3.1-405b-instruct-fp8": {
    price: mixPrice(0.8, 0.8),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3.1-70b-instruct": {
    price: mixPrice(0.12, 0.3),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3.1-8b-instruct": {
    price: mixPrice(0.02, 0.05),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3.1-tulu-3-70b": { isOpen: true, organization: "Allen" },
  "llama-3.1-tulu-3-8b": { isOpen: true, organization: "Allen" },
  "llama-3.1-nemotron-51b-instruct": { isOpen: true, organization: "NVIDIA" },
  "llama-3.1-nemotron-70b-instruct": {
    price: 0.24 + 0.3,
    isOpen: true,
    organization: "NVIDIA",
  },
  "llama-3.2-1b-instruct": {
    price: mixPrice(0.01, 0.02),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3.2-3b-instruct": {
    price: mixPrice(0.015, 0.025),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3.2-vision-11b-instruct": {
    price: mixPrice(0.055, 0.055),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3.2-vision-90b-instruct": {
    price: mixPrice(0.35, 0.4),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3.3-70b-instruct": {
    price: mixPrice(0.12, 0.3),
    isOpen: true,
    organization: "Meta",
  },
  "llama-3.3-nemotron-49b-super-v1": {
    isOpen: true,
    organization: "NVIDIA",
  },
  "llama-4-maverick-03-26-experimental": {
    price: mixPrice(0.2, 0.6),
    isOpen: true,
    organization: "Meta",
  },
  "llama2-70b-steerlm-chat": {
    deprecated: true,
    isOpen: true,
    organization: "NVIDIA",
  },
  "llava-v1.6-34b": { isOpen: true },
  "minicpm-v-2_6": { isOpen: true },
  "ministral-8b-2410": {
    price: mixPrice(0.1, 0.1),
    isOpen: true,
    organization: "Mistral",
  },
  "mistral-7b-instruct": {
    price: mixPrice(0.03, 0.055),
    isOpen: true,
    organization: "Mistral",
  },
  "mistral-7b-instruct-v0.2": {
    price: mixPrice(0.18, 0.18),
    isOpen: true,
    organization: "Mistral",
  },
  "mistral-large-2402": { price: mixPrice(2, 6), organization: "Mistral" },
  "mistral-large-2407": {
    price: mixPrice(2, 6),
    isOpen: true,
    organization: "Mistral",
  },
  "mistral-large-2411": {
    price: mixPrice(2, 6),
    isOpen: true,
    organization: "Mistral",
  },
  "mistral-medium": { price: mixPrice(2.75, 8.1), organization: "Mistral" },
  "mistral-next": { organization: "Mistral" },
  "mistral-small-24b-instruct-2501": {
    price: mixPrice(0.07, 0.14),
    isOpen: true,
    organization: "Mistral",
  },
  "mixtral-8x22b-instruct-v0.1": {
    price: mixPrice(0.9, 0.9),
    isOpen: true,
    organization: "Mistral",
  },
  "mixtral-8x7b-instruct-v0.1": {
    price: mixPrice(0.24, 0.24),
    isOpen: true,
    organization: "Mistral",
  },
  "molmo-72b-0924": { isOpen: true, organization: "Allen" },
  "molmo-7b-d-0924": { isOpen: true, organization: "Allen" },
  "mpt-30b-chat": { isOpen: true },
  "mpt-7b-chat": { isOpen: true },
  "nemotron-4-340b-instruct": { isOpen: true, organization: "NVIDIA" },
  "nous-hermes-2-mixtral-8x7b-dpo": { isOpen: true },
  "o1-mini": { price: mixPrice(3, 12 * 2.1), organization: "OpenAI" },
  "o1-preview": { price: mixPrice(15, 60 * 4.3), organization: "OpenAI" },
  "o1-2024-12-17": { price: mixPrice(15, 60 * 3.9), organization: "OpenAI" },
  "o3-mini": { price: mixPrice(1.1, 4.4 * 4.3), organization: "OpenAI" },
  "o3-mini-high": { price: mixPrice(1.1, 4.4 * 9.5), organization: "OpenAI" },
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
  "phi-4": { price: mixPrice(0.07, 0.14), isOpen: true, organization: "Microsoft" },
  "pixtral-12b-2409": {
    price: mixPrice(0.1, 0.1),
    isOpen: true,
    organization: "Mistral",
  },
  "pixtral-large-2411": {
    price: mixPrice(2, 6),
    isOpen: true,
    organization: "Mistral",
  },
  "qwen-14b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen-max-0428": { price: mixPrice(10, 30), organization: "Qwen" },
  "qwen-max-0919": { price: mixPrice(10, 30), organization: "Qwen" },
  "qwen-plus-0828": { deprecated: true, price: mixPrice(3, 9), organization: "Qwen" },
  "qwen-plus-0125": { price: mixPrice(0.4, 1.2), organization: "Qwen" },
  "qwen-vl-max-1119": { organization: "Qwen" },
  "qwen1.5-110b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-14b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-32b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-4b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-72b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-7b-chat": { deprecated: true, isOpen: true, organization: "Qwen" },
  "qwen2-72b-instruct": {
    price: mixPrice(0.34, 0.39),
    isOpen: true,
    organization: "Qwen",
  },
  "qwen2-vl-72b": { price: mixPrice(0.4, 0.4), isOpen: true, organization: "Qwen" },
  "qwen2-vl-7b-instruct": {
    price: mixPrice(0.1, 0.1),
    isOpen: true,
    organization: "Qwen",
  },
  "qwen2.5-vl-72b-instruct": { isOpen: true, organization: "Qwen" },
  "qwen2.5-72b-instruct": {
    price: mixPrice(0.23, 0.4),
    isOpen: true,
    organization: "Qwen",
  },
  "qwen2.5-coder-32b-instruct": {
    price: mixPrice(0.07, 0.16),
    isOpen: true,
    organization: "Qwen",
  },
  "qwen2.5-plus-1127": { price: mixPrice(3, 9), organization: "Qwen" },
  "qwq-32b-preview": {
    price: mixPrice(0.12, 0.18 * 4),
    isOpen: true,
    organization: "Qwen",
  },
  "qwq-32b": {
    price: mixPrice(0.12, 0.18 * 7.71),
    isOpen: true,
    organization: "Qwen",
  },
  "qwen2.5-max": {
    price: mixPrice(1.6, 6.4),
    organization: "Qwen",
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
  "yi-large": { organization: "01" },
  "yi-large-preview": { organization: "01" },
  "yi-lightning": { organization: "01" },
  "yi-lightning-lite": { organization: "01" },
  "zephyr-7b-alpha": { isOpen: true },
  "zephyr-7b-beta": { isOpen: true },
  "zephyr-orpo-141b-A35b-v0.1": { isOpen: true },
  reve: { organization: "Reve" },
  "gpt-4o": { organization: "OpenAI" },
  "recraft-3": { price: 0.04, organization: "Recraft" },
  "imagen-3-generate-002": { organization: "Google" },
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
  "gemini-2-flash-experimental": { organization: "Google" },
  "playground-2.5": { isOpen: true, organization: "Playground" },
  "dalle-3-hd": { price: 0.08, organization: "OpenAI" },
  "stable-diffusion-3.5-medium": { isOpen: true, price: 0.02, organization: "Stability" },
  "dalle-3": { price: 0.04, organization: "OpenAI" },
  "dalle-2": { deprecated: true, organization: "OpenAI" },
  "stable-diffusion-xl-1": { isOpen: true, price: 0.001, organization: "Stability" },
  "stable-diffusion-xl-turbo": { isOpen: true, price: 0.0002, organization: "Stability" },
  "janus-pro": { isOpen: true, price: 0.002, organization: "DeepSeek" },
} as const;
