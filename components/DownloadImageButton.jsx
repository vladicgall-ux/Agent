"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

export default function DownloadImageButton({ imageUrl, filename = "generated-image.jpg" }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-60 transition-colors px-4 py-2 text-sm font-medium text-white"
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {downloading ? "Скачивание..." : "Скачать изображение"}
    </button>
  );
}
