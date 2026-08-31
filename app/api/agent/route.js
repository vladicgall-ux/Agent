import { NextResponse } from "next/server";
import { getGroqClient } from "@/lib/groq";
import { getGeminiClient } from "@/lib/gemini";
import { scrapePage } from "@/lib/scrape";
import {
  DEFAULT_MODEL,
  GROQ_MODELS,
  INTENT_MODEL,
  IMAGE_MODEL,
  DEFAULT_IMAGE_ENGINE,
} from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MODEL_IDS = new Set(GROQ_MODELS.map((m) => m.id));
const ALLOWED_IMAGE_ENGINES = new Set(["pollinations_flux", "google_imagen"]);

function resolveModel(requestedModel) {
  if (requestedModel && ALLOWED_MODEL_IDS.has(requestedModel)) {
    return requestedModel;
  }
  return DEFAULT_MODEL;
}

function resolveImageEngine(requestedEngine) {
  if (requestedEngine && ALLOWED_IMAGE_ENGINES.has(requestedEngine)) {
    return requestedEngine;
  }
  return DEFAULT_IMAGE_ENGINE;
}

async function handlePageParsing(url, prompt, model) {
  const { title, text, images } = await scrapePage(url);

  const groq = getGroqClient();
  const userQuestion = prompt?.trim()
    ? prompt.trim()
    : "Сделай краткую выжимку и перескажи основную суть этой страницы.";

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "Ты — полезный ассистент, который анализирует текст веб-страницы и отвечает на вопрос пользователя по этому тексту. Отвечай на русском языке, структурированно, используя markdown при необходимости. Если текста страницы недостаточно для ответа — честно скажи об этом.",
      },
      {
        role: "user",
        content: `Заголовок страницы: ${title || "не указан"}\nURL: ${url}\n\nТекст страницы:\n"""\n${text}\n"""\n\nЗапрос пользователя: ${userQuestion}`,
      },
    ],
    temperature: 0.4,
  });

  const aiAnswer =
    completion.choices?.[0]?.message?.content?.trim() || "Не удалось получить ответ модели.";

  return NextResponse.json({
    type: "parsed_page",
    text: aiAnswer,
    images,
    sourceUrl: url,
  });
}

async function classifyIntent(prompt) {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: INTENT_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'Классифицируй запрос пользователя и верни строго JSON вида {"isImage": boolean, "imagePromptEnglish": string}. ' +
          "isImage = true, если пользователь просит нарисовать, сгенерировать, создать картинку/изображение/фото/арт/иллюстрацию. " +
          "В этом случае imagePromptEnglish — подробный, детализированный промпт на английском языке для модели генерации изображений (стиль, композиция, освещение, детали). " +
          "Если это обычный диалог, вопрос, код или анализ — isImage = false, imagePromptEnglish = \"\". Ответь только JSON, без пояснений.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(raw);
    return {
      isImage: Boolean(parsed.isImage),
      imagePromptEnglish: typeof parsed.imagePromptEnglish === "string" ? parsed.imagePromptEnglish : "",
    };
  } catch {
    return { isImage: false, imagePromptEnglish: "" };
  }
}

async function handleFluxGeneration(imagePromptEnglish) {
  const seed = Math.floor(Math.random() * 1_000_000_000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    imagePromptEnglish
  )}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`;

  return NextResponse.json({
    type: "generated_image",
    engine: "flux",
    text: imagePromptEnglish,
    imageUrl,
  });
}

async function handleImagenGeneration(imagePromptEnglish) {
  const gemini = getGeminiClient();

  const response = await gemini.models.generateImages({
    model: IMAGE_MODEL,
    prompt: imagePromptEnglish,
    config: {
      numberOfImages: 1,
      aspectRatio: "1:1",
    },
  });

  const generated = response?.generatedImages?.[0];
  const base64 = generated?.image?.imageBytes;

  if (!base64) {
    throw new Error("Google Imagen не вернул изображение.");
  }

  const imageUrl = `data:image/jpeg;base64,${base64}`;

  return NextResponse.json({
    type: "generated_image",
    engine: "imagen3",
    text: imagePromptEnglish,
    imageUrl,
  });
}

async function handleTextQuery(prompt, model) {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "Ты — полезный, дружелюбный AI-ассистент. Отвечай на русском языке (если пользователь не пишет на другом языке), структурированно, используя markdown при необходимости.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.6,
  });

  const aiTextResponse =
    completion.choices?.[0]?.message?.content?.trim() || "Не удалось получить ответ модели.";

  return NextResponse.json({ type: "text", text: aiTextResponse });
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const { prompt, url, textModel, imageEngine } = body || {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Поле prompt обязательно" }, { status: 400 });
  }

  const model = resolveModel(textModel);
  const engine = resolveImageEngine(imageEngine);

  try {
    if (url && typeof url === "string" && url.trim()) {
      let normalizedUrl = url.trim();
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      return await handlePageParsing(normalizedUrl, prompt, model);
    }

    const { isImage, imagePromptEnglish } = await classifyIntent(prompt);

    if (isImage) {
      const finalPrompt = imagePromptEnglish?.trim() || prompt;
      if (engine === "google_imagen") {
        return await handleImagenGeneration(finalPrompt);
      }
      return await handleFluxGeneration(finalPrompt);
    }

    return await handleTextQuery(prompt, model);
  } catch (error) {
    console.error("[/api/agent] error:", error);
    const message = error?.message || "Внутренняя ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
