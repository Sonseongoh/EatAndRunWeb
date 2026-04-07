"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ActionButton } from "@/app/components/action-button";
import { FoodAnalysisResultCard } from "@/app/components/food-analysis-result-card";
import { analyzeFoodText } from "@/lib/api";
import { calcAverageKcal } from "@/lib/running";
import { useLocale } from "@/providers/locale-provider";
import { useFlowStore } from "@/store/use-flow-store";

export function TextAnalyzeForm() {
  const { t } = useLocale();
  const { setAnalysis, resetFlow } = useFlowStore();
  const [foodText, setFoodText] = useState("");

  const analyzeMutation = useMutation({
    mutationFn: analyzeFoodText
  });

  function onAnalyze() {
    const normalized = foodText.trim();
    if (!normalized) return;

    analyzeMutation.mutate(normalized, {
      onSuccess: (analysis) => {
        const kcalAvg = calcAverageKcal(analysis.kcalMin, analysis.kcalMax);
        setAnalysis({ ...analysis, kcalAvg });
      }
    });
  }

  return (
    <>
      <div className="space-y-3">
        <label htmlFor="food-text-input" className="block text-sm font-semibold text-zinc-200">
          {t("음식 텍스트 입력", "Meal text input")}
        </label>
        <textarea
          id="food-text-input"
          value={foodText}
          onChange={(event) => {
            setFoodText(event.target.value);
            analyzeMutation.reset();
            resetFlow();
          }}
          rows={6}
          placeholder={t("예) 닭가슴살 샐러드 + 고구마 1개", "e.g. Chicken salad + 1 sweet potato")}
          className="w-full rounded-xl border border-white/15 bg-zinc-900/80 p-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
        />
        <p className="text-xs text-zinc-400">
          {t(
            "음식명과 양을 같이 입력하면 칼로리 범위를 더 안정적으로 추정할 수 있습니다.",
            "Including food name and portion helps estimate calories more accurately."
          )}
        </p>
      </div>

      <ActionButton
        onClick={onAnalyze}
        disabled={!foodText.trim() || analyzeMutation.isPending}
        variant="primary"
        size="sm"
        className="mx-auto mt-8 block disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:text-zinc-300"
      >
        {analyzeMutation.isPending
          ? t("분석 중...", "Analyzing...")
          : t("텍스트로 분석하기", "Analyze text")}
      </ActionButton>

      {analyzeMutation.isError && (
        <p className="text-sm text-red-300">{(analyzeMutation.error as Error).message}</p>
      )}

      {analyzeMutation.data && <FoodAnalysisResultCard analysis={analyzeMutation.data} />}
    </>
  );
}

