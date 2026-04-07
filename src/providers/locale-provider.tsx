"use client";

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type Locale = "ko" | "en";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (ko: string, en: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const LOCALE_STORAGE_KEY = "eatrun_locale";

function resolveInitialLocale(): Locale {
  if (typeof window === "undefined") return "ko";

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "ko" || stored === "en") return stored;

  const browser = window.navigator.language.toLowerCase();
  return browser.startsWith("ko") ? "ko" : "en";
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>("ko");

  useEffect(() => {
    setLocaleState(resolveInitialLocale());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
    }
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (ko, en) => (locale === "ko" ? ko : en)
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
