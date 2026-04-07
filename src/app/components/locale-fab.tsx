"use client";

import { useLocale } from "@/providers/locale-provider";

export function LocaleFab() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="fixed bottom-6 right-6 z-50 pb-[env(safe-area-inset-bottom)] md:bottom-8 md:right-8"
      aria-label="Language selector"
    >
      <div className="inline-flex overflow-hidden rounded-full border border-white/20 bg-zinc-950/85 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setLocale("ko")}
          className={`px-3 py-2 text-xs font-semibold transition ${
            locale === "ko" ? "bg-white text-zinc-900" : "text-zinc-100 hover:bg-white/10"
          }`}
        >
          KO
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`px-3 py-2 text-xs font-semibold transition ${
            locale === "en" ? "bg-white text-zinc-900" : "text-zinc-100 hover:bg-white/10"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
