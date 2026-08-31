import { NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";
export const maxDuration = 60;

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const MAX_IMAGES = 12;
const FETCH_TIMEOUT_MS = 15000;

const EXTENSION_BY_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
};

function guessExtension(url, contentType) {
  if (contentType) {
    const mime = contentType.split(";")[0].trim().toLowerCase();
    if (EXTENSION_BY_MIME[mime]) return EXTENSION_BY_MIME[mime];
  }
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
    if (match) return match[1].toLowerCase();
  } catch {
    // ignore
  }
  return "jpg";
}

async function fetchImageBuffer(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": BROWSER_USER_AGENT },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const arrayBuffer = await response.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const { images, text, sourceUrl } = body || {};

  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: "Список изображений пуст" }, { status: 400 });
  }

  const validImages = images
    .filter((src) => typeof src === "string" && src.trim())
    .slice(0, MAX_IMAGES);

  const zip = new JSZip();
  const imagesFolder = zip.folder("images");

  const results = await Promise.allSettled(
    validImages.map((src) => fetchImageBuffer(src))
  );

  let successCount = 0;
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const { buffer, contentType } = result.value;
    const ext = guessExtension(validImages[index], contentType);
    imagesFolder.file(`image-${String(index + 1).padStart(2, "0")}.${ext}`, buffer);
    successCount += 1;
  });

  if (successCount === 0) {
    return NextResponse.json(
      { error: "Не удалось скачать ни одно изображение" },
      { status: 502 }
    );
  }

  const descriptionParts = [];
  if (sourceUrl) descriptionParts.push(`Источник: ${sourceUrl}`);
  if (text) descriptionParts.push("", text);
  if (descriptionParts.length > 0) {
    zip.file("описание.txt", descriptionParts.join("\n"));
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="package.zip"',
      "Content-Length": String(zipBuffer.length),
    },
  });
}
