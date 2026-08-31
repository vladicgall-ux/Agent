"use client";

import { FolderArchive, Loader2 } from "lucide-react";
import { useState } from "react";

export default function DownloadZipButton({ images, text, sourceUrl }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setError("");

    try {
      const res = await fetch("/api/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, text, sourceUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Не удалось собрать архив");
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "package.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.message || "Не удалось собрать архив");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading || !images?.length}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-4 py-2 text-sm font-medium text-white"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FolderArchive className="h-4 w-4" />
        )}
        {downloading ? "Собираем архив..." : "Скачать всё в ZIP"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
