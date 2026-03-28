export type ActivityMode = "walk" | "brisk" | "run";

const METS: Record<ActivityMode, number> = {
  walk: 3.5,
  brisk: 5,
  run: 8.3
};

export function getActivityLabel(mode: ActivityMode) {
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
