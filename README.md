# AI Agent — Next.js + Groq + FLUX / Google Nano Banana

Гибридный AI-агент на Next.js (App Router) с тремя режимами работы:

1. **Текстовые ответы** — через Groq API (выбор из нескольких моделей).
2. **Генерация изображений** — автоматическое определение намерения пользователя, с выбором движка: **FLUX (Pollinations AI, бесплатно, без ключа)** или **Google Nano Banana** (`gemini-2.5-flash-image`) через `@google/genai`.
3. **Анализ веб-страниц** — парсинг HTML-страницы по ссылке (`cheerio`), извлечение текста и фотографий, и ответ модели на основе содержимого страницы.
4. **Пакетная выгрузка в ZIP** — для результата парсинга страницы можно скачать все найденные изображения + текстовое описание одним архивом.

## Стек

- Next.js 14 (App Router)
- Tailwind CSS
- lucide-react (иконки)
- groq-sdk
- @google/genai
- cheerio
- react-markdown + remark-gfm (рендер markdown-ответов)
- jszip (сборка ZIP-архива с изображениями на сервере)

## Структура проекта

```
app/
  api/agent/route.js       — основной backend-эндпоинт (POST /api/agent)
  api/download-zip/route.js — сборка ZIP-архива из изображений страницы (POST /api/download-zip)
  layout.js                — корневой layout
  page.jsx                 — главный UI
  globals.css               — стили Tailwind + типографика
components/
  ImageGallery.jsx          — галерея изображений, найденных на странице
  ResultView.jsx            — рендер результата (текст / картинка / страница)
  CopyButton.jsx             — кнопка копирования текстового ответа
  DownloadImageButton.jsx    — кнопка скачивания сгенерированного изображения (через blob)
  DownloadZipButton.jsx      — кнопка скачивания всех изображений страницы + описания в ZIP
  Skeleton.jsx               — индикатор загрузки
  Toast.jsx                  — всплывающие уведомления об ошибках
lib/
  groq.js                   — клиент Groq
  gemini.js                 — клиент Google GenAI (Nano Banana / interactions)
  scrape.js                 — логика парсинга страниц через cheerio
  models.js                 — список Groq-моделей и движков генерации изображений
```

## Переменные окружения

Создайте файл `.env.local` в корне проекта (пример — в `.env.local.example`):

```
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

- `GROQ_API_KEY` — ключ с [console.groq.com](https://console.groq.com/keys).
- `GEMINI_API_KEY` — ключ Google AI Studio / Gemini API (может иметь префикс `AQ.` или классический формат `AIzaSy...`, в зависимости от способа выпуска).
- `GEMINI_API_KEY` нужен только для движка **Google Nano Banana** — движок **FLUX (Pollinations AI)** работает без ключей.

На Vercel добавьте те же переменные в **Project Settings → Environment Variables**.

> **Важно про квоты Nano Banana:** бесплатный тариф Google AI Studio по умолчанию даёт **нулевую квоту** на генерацию изображений (`generativelanguage.googleapis.com`, модели `gemini-2.5-flash-image` и т.п.) — запрос вернёт `429 RESOURCE_EXHAUSTED, limit: 0`. Чтобы включить генерацию изображений, привяжите платёжный аккаунт (billing) к проекту в [Google AI Studio](https://aistudio.google.com/) / Google Cloud Console. Пока биллинг не включён — используйте движок **FLUX (Pollinations AI)**, он бесплатный и не требует ключей.

## Запуск локально

```bash
npm install
npm run dev
```

Приложение будет доступно на [http://localhost:3000](http://localhost:3000).

## Как это работает

### `POST /api/agent`

Тело запроса:

```json
{
  "prompt": "текст запроса",
  "url": "https://example.com (опционально)",
  "textModel": "qwen/qwen3.8-27b (опционально)",
  "imageEngine": "pollinations_flux | google_imagen (опционально)"
}
```

**Если передан `url` (режим парсинга страницы):**
1. Страница загружается с `User-Agent` браузера.
2. `cheerio` удаляет `script`, `style`, `noscript`, `nav`, `footer`, `header`, `svg`, `form`, `iframe` и другие "шумные" элементы.
3. Извлекается текст (до 20 000 символов) и до 12 уникальных абсолютных ссылок на изображения (`<img src>`, `data-src`, `srcset`, `og:image`).
4. Текст + запрос пользователя отправляются в Groq (выбранная `textModel`).
5. Ответ: `{ type: "parsed_page", text, images, sourceUrl }`.

**Если `url` не передан (режим автономного агента):**
1. Groq (`openai/gpt-oss-20b`, `temperature: 0`, JSON-режим) классифицирует запрос и возвращает `{ isImage, imagePromptEnglish }`.
2. **`isImage === true`** → генерация изображения выбранным движком:
   - `pollinations_flux` (по умолчанию) — прямая ссылка на `image.pollinations.ai` со случайным `seed`, без внешних API-ключей. Ответ: `{ type: "generated_image", engine: "flux", text, imageUrl }`.
   - `google_imagen` — вызов `ai.interactions.create` с моделью `gemini-2.5-flash-image` ("Nano Banana", `response_format: { type: "image", aspect_ratio: "1:1", delivery: "inline" }`). Ответ: `{ type: "generated_image", engine: "imagen3", text, imageUrl }` (`imageUrl` — base64 Data URL, взят из `interaction.output_image.data` / `.mime_type`).
3. **`isImage === false`** → ответ Groq с выбранной `textModel` → `{ type: "text", text }`.

### `POST /api/download-zip`

Собирает ZIP-архив на сервере из результата парсинга страницы. Тело запроса:

```json
{
  "images": ["https://.../1.jpg", "https://.../2.jpg"],
  "text": "текстовое описание (опционально, попадёт в описание.txt)",
  "sourceUrl": "https://example.com (опционально)"
}
```

1. Каждое изображение скачивается сервером (с `User-Agent` браузера, таймаут 15 сек на файл, максимум 12 изображений).
2. Успешно скачанные файлы кладутся в папку `images/` внутри архива (`image-01.jpg`, `image-02.png`, ...), формат определяется по `Content-Type` или расширению в URL.
3. Если переданы `text`/`sourceUrl` — в архив добавляется `описание.txt`.
4. Ответ — бинарный `application/zip` (`Content-Disposition: attachment; filename="package.zip"`). Если не удалось скачать ни одного изображения — JSON `{ error }` со статусом 502.

Кнопка «Скачать всё в ZIP» появляется в блоке результата парсинга страницы рядом с галереей изображений.

## Деплой на Vercel

1. Запушьте репозиторий на GitHub.
2. Импортируйте проект в Vercel.
3. Добавьте переменные окружения `GROQ_API_KEY` и `GEMINI_API_KEY`.
4. Deploy — дополнительная конфигурация не требуется (используется `app/api/agent/route.js` как serverless-функция, `runtime = "nodejs"`).

## Примечания

- Убедитесь, что названия моделей Groq (`lib/models.js`) актуальны на момент использования — список моделей Groq периодически обновляется/устаревает, сверяйтесь с [console.groq.com/docs/models](https://console.groq.com/docs/models).
- Парсинг страниц ограничен: некоторые сайты блокируют серверные запросы (Cloudflare, антибот-защита) — в этом случае API вернёт ошибку с HTTP-статусом исходного запроса.
- FLUX-изображения (Pollinations AI) генерируются на стороннем бесплатном сервисе без SLA — при недоступности сервиса переключитесь на движок Google Nano Banana.
- Классическая линейка Imagen (`ai.models.generateImages`, модели `imagen-3.0-*` / `imagen-4.0-*`) на момент написания **отключена** на Gemini Developer API — актуальный способ генерации изображений через Gemini — модели "Nano Banana" (`gemini-2.5-flash-image`, `gemini-3.1-flash-image` и др.) через `ai.interactions.create`. Если Google снова изменит API — проверьте [ai.google.dev/gemini-api/docs/image-generation](https://ai.google.dev/gemini-api/docs/image-generation) и обновите `IMAGE_MODEL` в `lib/models.js`.
