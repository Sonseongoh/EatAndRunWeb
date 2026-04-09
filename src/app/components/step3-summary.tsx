"use client";

import { ActivityMode, getActivityLabel } from "@/lib/activity";
import { Locale } from "@/providers/locale-provider";

type Step3SummaryProps = {
  targetBurnKcal: number;
  burnRatioPercent: number;
  mode: ActivityMode;
  durationMin: number;
  locale: Locale;
  t: (ko: string, en: string) => string;
};

export function Step3Summary({
  targetBurnKcal,
  burnRatioPercent,
  mode,
  durationMin,
  locale,
  t
}: Step3SummaryProps) {
  return (
    <div className="glass-soft p-4 text-sm text-zinc-200">
      <p>{t("목표 소모", "Target burn")}: {targetBurnKcal} kcal</p>
      <p>{t("설정 비율", "Ratio")}: {burnRatioPercent}%</p>
      <p>{t("선택 방식", "Selected mode")}: {getActivityLabel(mode, locale)}</p>
      <p>
        {t("권장 시간", "Recommended time")}:{" "}
        <span className="font-bold text-emerald-300">
          {durationMin}
          {t("분", " min")}
        </span>
      </p>
    </div>
  );
}
