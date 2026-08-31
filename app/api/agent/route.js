import { NextResponse } from "next/server";
import { getGroqClient } from "@/lib/groq";
import { getGeminiClient } from "@/lib/gemini";
import { scrapePage } from "@/lib/scrape";
import { DEFAULT_MODEL, GROQ_MODELS, INTENT_MODEL, IMAGE_MODEL } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MODEL_IDS = new Set(GROQ_MODELS.map((m) => m.id));

function resolveModel(requestedModel) {
  if (requestedModel && ALLOWED_MODEL_IDS.has(requestedModel)) {
    return requestedModel;
  }
  return DEFAULT_MODEL;
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
          "Ты — полезный ассистент, который анализирует текст веб-страницы и отвечает на вопрос пользователя по этому тексту. Отвечай на русском языке, структурировано, используя markdown при необходимости. Если текста страницы недостаточно для ответа — честно скажи об этом.",
      },
      {
        role: "user",
        content: `Заголовок страницы: ${title || "не указан"}\nURL: ${url}\n\nТекст страницы:\n"""\n${text}\n"""\n\nЗапрос пользователя: ${userQuestion}`,
      },
    ],
    temperature: 0.4,
  });

  const aiResponse =
    completion.choices?.[0]?.message?.content?.trim() || "Не удалось получить ответ модели.";

  return NextResponse.json({
    type: "parsed_page",
    text: aiResponse,
    images,
    sourceUrl: url,
  });
}

async function classifyIntent(prompt) {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: INTENT_MODEL,
    messages: [
      {
        role: "system",
        content:
          'Классифицируй запрос пользователя. Если пользователь просит нарисовать, сгенерировать, создать картинку/изображение/фото/арт — ответь строго JSON {"intent":"image","prompt":"<оптимизированный англоязычный промпт для генерации изображения, описывающий сцену подробно>"}. Иначе ответь строго JSON {"intent":"text"}. Никакого текста кроме JSON.',
      },
      { role: "user", content: prompt },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(raw);
  } catch {
    return { intent: "text" };
  }
}

async function handleImageGeneration(promptForImage) {
  const gemini = getGeminiClient();

  const response = await gemini.models.generateImages({
    model: IMAGE_MODEL,
    prompt: promptForImage,
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
    text: promptForImage,
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

  const text = completion.choices?.[0]?.message?.content?.trim() || "Не удалось получить ответ модели.";

  return NextResponse.json({ type: "text", text });
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const { prompt, url, model: requestedModel } = body || {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Поле prompt обязательно" }, { status: 400 });
  }

  const model = resolveModel(requestedModel);

  try {
    if (url && typeof url === "string" && url.trim()) {
      let normalizedUrl = url.trim();
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      return await handlePageParsing(normalizedUrl, prompt, model);
    }

    const intent = await classifyIntent(prompt);

    if (intent?.intent === "image") {
      const imagePrompt = intent.prompt?.trim() || prompt;
      return await handleImageGeneration(imagePrompt);
    }

    return await handleTextQuery(prompt, model);
  } catch (error) {
    console.error("[/api/agent] error:", error);
    const message = error?.message || "Внутренняя ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
