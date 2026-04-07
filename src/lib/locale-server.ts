import { cookies } from "next/headers";
import type { Locale } from "@/providers/locale-provider";

const LOCALE_COOKIE_KEY = "eatrun_locale";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
  return value === "en" ? "en" : "ko";
}

export function pickByLocale(locale: Locale, ko: string, en: string) {
  return locale === "en" ? en : ko;
}

