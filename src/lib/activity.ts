import type { Locale } from "@/providers/locale-provider";

export type ActivityMode = "walk" | "brisk" | "run";

// MET 값은 Compendium of Physical Activities 표준값.
// walk 3.5(≈5km/h) · brisk 5(≈6.4km/h) · run 9(≈8.4km/h, 일반인 조깅).
// run의 가정 속도(8.4km/h)는 기본 페이스(use-run-profile-store)와 일치시켜 둔다.
const METS: Record<ActivityMode, number> = {
  walk: 3.5,
  brisk: 5,
  run: 9
};

export function getActivityLabel(mode: ActivityMode, locale: Locale = "ko") {
  if (locale === "en") {
    if (mode === "walk") return "Walk";
    if (mode === "brisk") return "Brisk walk";
    return "Run";
  }

  if (mode === "walk") return "걷기";
  if (mode === "brisk") return "빠른걸음";
  return "달리기";
}

export function calculateDurationMinutes(params: {
  targetKcal: number;
  weightKg: number;
  mode: ActivityMode;
}) {
  const { targetKcal, weightKg, mode } = params;
  const met = METS[mode];
  const kcalPerMinute = (met * 3.5 * weightKg) / 200;
  if (!Number.isFinite(kcalPerMinute) || kcalPerMinute <= 0) return 0;
  return Math.max(1, Math.round(targetKcal / kcalPerMinute));
}

