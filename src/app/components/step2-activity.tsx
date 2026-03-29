"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityMode,
  calculateDurationMinutes,
  getActivityLabel
} from "@/lib/activity";
import { useFlowStore } from "@/store/use-flow-store";
import { useRunProfileStore } from "@/store/use-run-profile-store";

const options: ActivityMode[] = ["walk", "brisk", "run"];

export function Step2Activity() {
  const router = useRouter();
  const { analysis, mode, setActivity, setRoutes } = useFlowStore();
  const { weightKg, setWeightKg, burnRatioPercent, setBurnRatioPercent } =
    useRunProfileStore();
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
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10 md:px-8">
      <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">2단계: 운동 방식 선택</h1>
        <p className="mt-2 text-sm text-slate-600">
          걷기, 빠른걸음, 달리기 중 하나를 선택하면 소모에 필요한 시간을 계산합니다.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-700">
              목표 소모 칼로리: <span className="font-semibold">{targetBurnKcal} kcal</span>
            </p>
            <p className="text-xs text-slate-600">
              (섭취 {analysis.kcalAvg} kcal의 {burnRatioPercent}%)
            </p>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-slate-500">비율</span>
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
              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs"
            />
            <span className="text-xs text-slate-600">%</span>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700">몸무게(kg)</label>
        <input
          type="number"
          min={35}
          max={150}
          value={weightKg}
          onChange={(e) => setWeightKg(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-3 gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSelectedMode(option)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                selectedMode === option
                  ? "border-mint-500 bg-mint-500 text-white"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {getActivityLabel(option)}
            </button>
          ))}
        </div>

        <div className="rounded-lg bg-mint-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">계산 결과</p>
          <p className="mt-1">
            {getActivityLabel(selectedMode)} 기준{" "}
            <span className="font-bold text-mint-700">{durationMin}분</span> 운동하면 됩니다.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
          >
            이전 화면
          </Link>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg bg-mint-500 px-3 py-2 text-xs font-semibold text-white"
          >
            지도 화면으로
          </button>
        </div>
      </section>
    </main>
  );
}
