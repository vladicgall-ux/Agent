"use client";

import { useState } from "react";
import {
  Bot,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { GROQ_MODELS, DEFAULT_MODEL, IMAGE_ENGINES, DEFAULT_IMAGE_ENGINE } from "@/lib/models";
import ResultView from "@/components/ResultView";
import Skeleton from "@/components/Skeleton";
import Toast from "@/components/Toast";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [showUrlField, setShowUrlField] = useState(false);
  const [textModel, setTextModel] = useState(DEFAULT_MODEL);
  const [imageEngine, setImageEngine] = useState(DEFAULT_IMAGE_ENGINE);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          url: showUrlField ? url.trim() : undefined,
          textModel,
          imageEngine,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Произошла ошибка при обработке запроса");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Не удалось получить ответ. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-50">AI Agent</h1>
            <p className="text-xs text-zinc-500">Groq · FLUX / Nano Banana · Веб-парсинг</p>
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 space-y-3 shadow-xl shadow-black/20"
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Спросите что угодно, попросите нарисовать картинку или вставьте ссылку ниже..."
            rows={3}
            className="w-full resize-none rounded-lg bg-zinc-950 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
          />

          {showUrlField && (
            <div className="relative animate-fadeIn">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/статья"
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none pl-9 pr-9 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  setShowUrlField(false);
                  setUrl("");
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                aria-label="Убрать ссылку"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {!showUrlField && (
                <button
                  type="button"
                  onClick={() => setShowUrlField(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  Добавить ссылку
                </button>
              )}

              <select
                value={textModel}
                onChange={(e) => setTextModel(e.target.value)}
                title="Текстовая модель Groq"
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-brand-500 transition-colors"
              >
                {GROQ_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-zinc-500 ml-0.5" />
                <select
                  value={imageEngine}
                  onChange={(e) => setImageEngine(e.target.value)}
                  title="Движок генерации изображений"
                  className="bg-transparent text-xs text-zinc-300 outline-none"
                >
                  {IMAGE_ENGINES.map((eng) => (
                    <option key={eng.id} value={eng.id} className="bg-zinc-900">
                      {eng.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-4 py-2 text-sm font-medium text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? "Обработка..." : "Отправить"}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-6 min-h-[160px]">
          {loading && <Skeleton />}

          {!loading && !result && (
            <div className="flex flex-col items-center justify-center text-center py-10 text-zinc-600">
              <Sparkles className="h-8 w-8 mb-3 text-zinc-700" />
              <p className="text-sm">
                Задайте вопрос, попросите сгенерировать изображение
                <br />
                или проанализировать содержимое веб-страницы по ссылке.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="animate-fadeIn">
              <ResultView result={result} />
            </div>
          )}
        </section>
      </div>

      <Toast message={error} onClose={() => setError("")} />
    </main>
  );
}
