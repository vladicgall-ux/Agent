import "./globals.css";

export const metadata = {
  title: "AI Agent — Groq + Gemini",
  description:
    "Универсальный AI-агент: текстовые ответы через Groq, генерация изображений через Google Imagen и парсинг веб-страниц.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen bg-zinc-950 antialiased selection:bg-brand-500/30">
        {children}
      </body>
    </html>
  );
}
