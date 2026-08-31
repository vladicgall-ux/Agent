import { GoogleGenAI } from "@google/genai";

let client = null;

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY не задан. Добавьте его в .env.local или переменные окружения Vercel."
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}
