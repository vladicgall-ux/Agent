"use client";

import { Download, Link as LinkIcon, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ImageGallery from "./ImageGallery";

function TextResult({ text }) {
  return (
    <div className="prose-agent">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

function GeneratedImageResult({ text, imageUrl }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-brand-300">
        <Sparkles className="h-4 w-4" />
        Сгенерированное изображение
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={text} className="w-full max-w-xl mx-auto" />
      </div>
      <p className="text-sm text-zinc-400 italic">{text}</p>
      <a
        href={imageUrl}
        download="generated-image.jpg"
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 transition-colors px-4 py-2 text-sm font-medium text-white"
      >
        <Download className="h-4 w-4" />
        Скачать изображение
      </a>
    </div>
  );
}

function ParsedPageResult({ text, images, sourceUrl }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-brand-300">
        <LinkIcon className="h-4 w-4" />
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate hover:underline"
        >
          {sourceUrl}
        </a>
      </div>
      <TextResult text={text} />
      {images && images.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-300">
            Изображения со страницы ({images.length})
          </h3>
          <ImageGallery images={images} />
        </div>
      )}
    </div>
  );
}

export default function ResultView({ result }) {
  if (!result) return null;

  if (result.type === "generated_image") {
    return <GeneratedImageResult text={result.text} imageUrl={result.imageUrl} />;
  }

  if (result.type === "parsed_page") {
    return (
      <ParsedPageResult
        text={result.text}
        images={result.images}
        sourceUrl={result.sourceUrl}
      />
    );
  }

  return <TextResult text={result.text} />;
}
