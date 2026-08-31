export const GROQ_MODELS = [
  { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B (по умолчанию)" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
];

export const DEFAULT_MODEL = GROQ_MODELS[0].id;

export const INTENT_MODEL = "openai/gpt-oss-20b";

// Imagen 3/4 (ai.models.generateImages) is deprecated/shut down on the
// Gemini Developer API — Google's current image-generation path is the
// "Nano Banana" family via ai.interactions.create().
export const IMAGE_MODEL = "gemini-2.5-flash-image";

export const IMAGE_ENGINES = [
  { id: "pollinations_flux", label: "FLUX (Pollinations AI, бесплатно)" },
  { id: "google_imagen", label: "Google Nano Banana (Gemini 2.5 Flash Image)" },
];

export const DEFAULT_IMAGE_ENGINE = "pollinations_flux";
