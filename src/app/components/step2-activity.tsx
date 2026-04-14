"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/app/components/action-button";
import { ActivityMode, calculateDurationMinutes, getActivityLabel } from "@/lib/activity";
import { useLocale } from "@/providers/locale-provider";
import { useFlowStore } from "@/store/use-flow-store";
import { useRunProfileStore } from "@/store/use-run-profile-store";

const options: ActivityMode[] = ["walk", "brisk", "run"];

export function Step2Activity() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { analysis, mode, setActivity, setRoutes } = useFlowStore();
  const { weightKg, setWeightKg, burnRatioPercent, setBurnRatioPercent } = useRunProfileStore();
  const [selectedMode, setSelectedMode] = useState<ActivityMode>(mode || "walk");

  useEffect(() => {
    if (!analysis) router.replace("/");
  }, [analysis, router]);

  useEffect(() => {
    router.prefetch("/map");
  }, [router]);

  const targetBurnKcal = useMemo(() => {
    if (!analysis) return 0;
    return Math.max(1, Math.round((analysis.kcalAvg * burnRatioPercent) / 100));
  }, [analysis, burnRatioPercent]);

  const durationMin = useMemo(() => {
    if (!analysis) return 0;
    return calculateDurationMinutes({
      targetKcal: targetBurnKcal,
      weightKg,
      mode: selectedMode
    });
  }, [analysis, selectedMode, targetBurnKcal, weightKg]);

  function onNext() {
    if (!analysis) return;
    setActivity(selectedMode, durationMin);
    setRoutes([]);
    router.push("/map");
  }

  if (!analysis) return null;

  return (
    <main className="app-shell md:px-8">
      <section className="glass-card text-center">
        <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">
          {t("2단계: 운동 방식 선택", "Step 2: Choose activity")}
        </h1>
        <p className="mx-auto mt-2 max-w-3xl break-keep text-sm text-zinc-300">
          {t(
            "걷기, 빠른걸음, 달리기 중 하나를 선택하면 소모에 필요한 시간을 계산합니다.",
            "Choose walk, brisk walk, or run to estimate required duration."
          )}
        </p>
      </section>

      <section className="glass-card flex min-h-[32rem] flex-col space-y-6 md:min-h-[36rem]">
        <div className="glass-soft mt-6 p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-200">
              {t("목표 소모 칼로리", "Target burn")}:{" "}
              <span className="inline-block whitespace-nowrap font-semibold">{targetBurnKcal} kcal</span>
            </p>
            <p className="text-xs text-zinc-400">
              ({t("섭취", "Intake")} <span className="whitespace-nowrap">{analysis.kcalAvg} kcal</span>{" "}
              {t("의", "")} {burnRatioPercent}%)
            </p>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="shrink-0 whitespace-nowrap text-xs text-zinc-400">{t("비율", "Ratio")}</span>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={burnRatioPercent}
              onChange={(e) => setBurnRatioPercent(Number(e.target.value))}
              className="w-full"
            />
            <input
              type="number"
              min={10}
              max={80}
              step={5}
              value={burnRatioPercent}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isFinite(next)) return;
                setBurnRatioPercent(Math.min(80, Math.max(10, next)));
              }}
              className="glass-input w-16 shrink-0 rounded-md px-2 py-1 text-xs"
            />
            <span className="shrink-0 text-xs text-zinc-300">%</span>
          </div>
        </div>

        <label className="block text-sm font-medium text-zinc-200">{t("몸무게(kg)", "Weight (kg)")}</label>
        <input
          type="number"
          min={35}
          max={150}
          value={weightKg}
          onChange={(e) => setWeightKg(Number(e.target.value))}
          className="glass-input w-full rounded-lg px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-3 gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSelectedMode(option)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                selectedMode === option
                  ? "border-emerald-300 bg-emerald-300 text-zinc-900"
                  : "border-white/20 bg-zinc-900/60 text-zinc-200"
              }`}
            >
              {getActivityLabel(option, locale)}
            </button>
          ))}
        </div>

        <div className="glass-soft p-6 text-sm text-zinc-200">
          <p className="font-semibold text-zinc-100">{t("계산 결과", "Result")}</p>
          <p className="mt-1">
            {getActivityLabel(selectedMode, locale)} {t("기준", "mode")},{" "}
            <span className="font-bold text-emerald-300">{durationMin}{t("분", " min")}</span>{" "}
            {t("운동하면 됩니다.", "of activity is recommended.")}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap justify-center gap-4 pt-2">
          <ActionButton href="/analyze" variant="ghost" size="xs">
            {t("이전 화면", "Back")}
          </ActionButton>
          <ActionButton onClick={onNext} variant="primary" size="xs" icon={<span>→</span>} iconPosition="right">
            {t("지도 화면으로", "Go to map")}
          </ActionButton>
        </div>
      </section>
    </main>
  );
}
