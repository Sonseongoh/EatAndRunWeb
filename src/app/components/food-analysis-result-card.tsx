"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/app/components/action-button";
import { calcAverageKcal } from "@/lib/running";
import { FoodAnalysisResponse } from "@/lib/types";
import { useLocale } from "@/providers/locale-provider";

type FoodAnalysisResultCardProps = {
  analysis: FoodAnalysisResponse;
};

export function FoodAnalysisResultCard({ analysis }: FoodAnalysisResultCardProps) {
  const router = useRouter();
  const { t } = useLocale();

  return (
    <div className="glass-soft p-4 text-sm text-zinc-200">
      <p className="font-semibold text-zinc-100">{t("분석 결과", "Analysis result")}</p>
      <p className="mt-2">
        {t("음식", "Meal")}: {analysis.foodName}
      </p>
      <p>
        {t("칼로리", "Calories")}: {analysis.kcalMin} - {analysis.kcalMax} kcal
      </p>
      <p>
        {t("평균 칼로리", "Average calories")}: {calcAverageKcal(analysis.kcalMin, analysis.kcalMax)} kcal
      </p>
      <ActionButton
        onClick={() => router.push("/activity")}
        variant="ghost"
        size="xs"
        className="mx-auto mt-3 block"
      >
        {t("다음 화면으로", "Continue")}
      </ActionButton>
    </div>
  );
}

