"use client";

import { Link as LinkIcon, Sparkles, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyButton from "./CopyButton";
import DownloadImageButton from "./DownloadImageButton";
import DownloadZipButton from "./DownloadZipButton";
import ImageGallery from "./ImageGallery";

const ENGINE_LABELS = {
  flux: "FLUX (Pollinations AI)",
  imagen3: "Google Nano Banana (Gemini 2.5 Flash Image)",
};

function TextResult({ text, showCopy = true }) {
  return (
    <div className="space-y-3">
      {showCopy && (
        <div className="flex justify-end">
          <CopyButton text={text} />
        </div>
      )}
      <div className="prose-agent">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </div>
  );
}

function GeneratedImageResult({ text, imageUrl, engine }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-brand-300">
        <Sparkles className="h-4 w-4" />
        Сгенерированное изображение
        {engine && (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            <Wand2 className="h-3 w-3" />
            {ENGINE_LABELS[engine] || engine}
          </span>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={text} className="w-full max-w-xl mx-auto" />
      </div>
      <p className="text-sm text-zinc-400 italic">{text}</p>
      <DownloadImageButton imageUrl={imageUrl} filename={`${engine || "generated"}-image.jpg`} />
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
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-300">
              Изображения со страницы ({images.length})
            </h3>
            <DownloadZipButton images={images} text={text} sourceUrl={sourceUrl} />
          </div>
          <ImageGallery images={images} />
        </div>
      )}
    </div>
  );
}

export default function ResultView({ result }) {
  if (!result) return null;

  if (result.type === "generated_image") {
    return (
      <GeneratedImageResult text={result.text} imageUrl={result.imageUrl} engine={result.engine} />
    );
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
