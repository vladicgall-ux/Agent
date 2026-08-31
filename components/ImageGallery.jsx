"use client";

import { Download, ExternalLink, ImageOff } from "lucide-react";
import { useState } from "react";

function GalleryItem({ src }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Изображение со страницы"
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/70 via-black/0 to-black/0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-zinc-950/80 p-1.5 text-zinc-100 hover:bg-brand-600 transition-colors"
          title="Открыть оригинал"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-zinc-950/80 p-1.5 text-zinc-100 hover:bg-brand-600 transition-colors"
          title="Скачать"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

export default function ImageGallery({ images }) {
  if (!images || images.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <ImageOff className="h-4 w-4" />
        Изображения на странице не найдены
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {images.map((src, idx) => (
        <GalleryItem key={`${src}-${idx}`} src={src} />
      ))}
    </div>
  );
}
