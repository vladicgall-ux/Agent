import * as cheerio from "cheerio";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const MAX_TEXT_LENGTH = 20000;
const MAX_IMAGES = 12;

function toAbsoluteUrl(src, baseUrl) {
  if (!src) return null;
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return null;
  }
}

function isLikelyRealImage(url) {
  if (!url) return false;
  if (url.startsWith("data:")) return false;
  const lower = url.toLowerCase();
  if (lower.includes("1x1") || lower.includes("pixel") || lower.includes("spacer")) {
    return false;
  }
  return true;
}

export async function scrapePage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить страницу (HTTP ${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("xml")) {
    throw new Error("Указанная ссылка не является HTML-страницей");
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const pageImages = [];
  const seen = new Set();

  $("img").each((_, el) => {
    if (pageImages.length >= MAX_IMAGES) return;
    const $el = $(el);
    const rawSrc =
      $el.attr("src") ||
      $el.attr("data-src") ||
      $el.attr("data-lazy-src") ||
      ($el.attr("srcset") ? $el.attr("srcset").split(",")[0].trim().split(" ")[0] : null);

    const absolute = toAbsoluteUrl(rawSrc, url);
    if (!isLikelyRealImage(absolute)) return;
    if (seen.has(absolute)) return;

    seen.add(absolute);
    pageImages.push(absolute);
  });

  // Also pick up Open Graph image as a fallback candidate
  const ogImage = $('meta[property="og:image"]').attr("content");
  const absoluteOg = toAbsoluteUrl(ogImage, url);
  if (absoluteOg && !seen.has(absoluteOg) && pageImages.length < MAX_IMAGES) {
    pageImages.unshift(absoluteOg);
  }

  $("script, style, nav, footer, header, svg, iframe, noscript, form, button, aside").remove();

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const text = bodyText.slice(0, MAX_TEXT_LENGTH);

  const title = $("title").first().text().trim();

  return {
    title,
    text,
    images: pageImages.slice(0, MAX_IMAGES),
  };
}
