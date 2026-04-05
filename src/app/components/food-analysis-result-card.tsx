"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/app/components/action-button";
import { FoodAnalysisResponse } from "@/lib/types";
import { calcAverageKcal } from "@/lib/running";

type FoodAnalysisResultCardProps = {
  analysis: FoodAnalysisResponse;
};

export function FoodAnalysisResultCard({ analysis }: FoodAnalysisResultCardProps) {
  const router = useRouter();

  return (
    <div className="glass-soft p-4 text-sm text-zinc-200">
      <p className="font-semibold text-zinc-100">분석 결과</p>
      <p className="mt-2">음식: {analysis.foodName}</p>
      <p>
        칼로리: {analysis.kcalMin} - {analysis.kcalMax} kcal
      </p>
      <p>평균 칼로리: {calcAverageKcal(analysis.kcalMin, analysis.kcalMax)} kcal</p>
      <ActionButton
        onClick={() => router.push("/activity")}
        variant="ghost"
        size="xs"
        className="mx-auto mt-3 block"
      >
        다음 화면으로
      </ActionButton>
    </div>
  );
}

