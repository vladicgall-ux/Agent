"use client";

import { AlertCircle, X } from "lucide-react";
import { useEffect } from "react";

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 animate-slideIn">
      <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/90 backdrop-blur px-4 py-3 shadow-2xl shadow-red-950/50 sm:max-w-sm">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
        <p className="text-sm text-red-100 leading-snug">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto shrink-0 text-red-300/70 hover:text-red-100 transition-colors"
          aria-label="Закрыть уведомление"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
