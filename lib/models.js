export const GROQ_MODELS = [
  { id: "qwen/qwen3-32b", label: "Qwen 3 32B (по умолчанию)" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
];

export const DEFAULT_MODEL = GROQ_MODELS[0].id;

export const INTENT_MODEL = "openai/gpt-oss-20b";

export const IMAGE_MODEL = "imagen-3.0-generate-002";
