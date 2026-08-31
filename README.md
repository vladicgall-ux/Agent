# AI Agent — Next.js + Groq + FLUX / Google Imagen

Гибридный AI-агент на Next.js (App Router) с тремя режимами работы:

1. **Текстовые ответы** — через Groq API (выбор из нескольких моделей).
2. **Генерация изображений** — автоматическое определение намерения пользователя, с выбором движка: **FLUX (Pollinations AI, бесплатно, без ключа)** или **Google Imagen 3** через `@google/genai`.
3. **Анализ веб-страниц** — парсинг HTML-страницы по ссылке (`cheerio`), извлечение текста и фотографий, и ответ модели на основе содержимого страницы.

## Стек

- Next.js 14 (App Router)
- Tailwind CSS
- lucide-react (иконки)
- groq-sdk
- @google/genai
- cheerio
- react-markdown + remark-gfm (рендер markdown-ответов)

## Структура проекта

```
app/
  api/agent/route.js       — единственный backend-эндпоинт (POST /api/agent)
  layout.js                — корневой layout
  page.jsx                 — главный UI
  globals.css               — стили Tailwind + типографика
components/
  ImageGallery.jsx          — галерея изображений, найденных на странице
  ResultView.jsx            — рендер результата (текст / картинка / страница)
  CopyButton.jsx             — кнопка копирования текстового ответа
  DownloadImageButton.jsx    — кнопка скачивания сгенерированного изображения (через blob)
  Skeleton.jsx               — индикатор загрузки
  Toast.jsx                  — всплывающие уведомления об ошибках
lib/
  groq.js                   — клиент Groq
  gemini.js                 — клиент Google GenAI (Imagen)
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
- `GEMINI_API_KEY` нужен только для движка **Google Imagen 3** — движок **FLUX (Pollinations AI)** работает без ключей.

На Vercel добавьте те же переменные в **Project Settings → Environment Variables**.

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
  "textModel": "qwen/qwen3-32b (опционально)",
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
   - `google_imagen` — вызов `ai.models.generateImages` (`imagen-3.0-generate-002`, 1:1). Ответ: `{ type: "generated_image", engine: "imagen3", text, imageUrl }` (`imageUrl` — base64 Data URL).
3. **`isImage === false`** → ответ Groq с выбранной `textModel` → `{ type: "text", text }`.

## Деплой на Vercel

1. Запушьте репозиторий на GitHub.
2. Импортируйте проект в Vercel.
3. Добавьте переменные окружения `GROQ_API_KEY` и `GEMINI_API_KEY`.
4. Deploy — дополнительная конфигурация не требуется (используется `app/api/agent/route.js` как serverless-функция, `runtime = "nodejs"`).

## Примечания

- Убедитесь, что названия моделей Groq (`lib/models.js`) актуальны на момент использования — список моделей Groq периодически обновляется/устаревает, сверяйтесь с [console.groq.com/docs/models](https://console.groq.com/docs/models).
- Парсинг страниц ограничен: некоторые сайты блокируют серверные запросы (Cloudflare, антибот-защита) — в этом случае API вернёт ошибку с HTTP-статусом исходного запроса.
- FLUX-изображения (Pollinations AI) генерируются на стороннем бесплатном сервисе без SLA — при недоступности сервиса переключитесь на движок Google Imagen 3.
