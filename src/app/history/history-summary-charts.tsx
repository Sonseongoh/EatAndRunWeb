"use client";

import { useMemo } from "react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { getActivityLabel } from "@/lib/activity";
import { HistoryEntry } from "@/lib/types";
import { buildDailyBurnSeries, buildModeDistribution } from "./history-utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

type HistorySummaryChartsProps = {
  entries: HistoryEntry[];
  locale: "ko" | "en";
  t: (ko: string, en: string) => string;
  showTargetOverlay: boolean;
  onToggleTargetOverlay: (checked: boolean) => void;
};

export function HistorySummaryCharts({
  entries,
  locale,
  t,
  showTargetOverlay,
  onToggleTargetOverlay
}: HistorySummaryChartsProps) {
  const dailyBurnSeries = useMemo(() => buildDailyBurnSeries(entries), [entries]);
  const modeDistribution = useMemo(() => buildModeDistribution(entries), [entries]);

  const burnLineData = useMemo(
    () => ({
      labels: dailyBurnSeries.map((row) => row.date),
      datasets: [
        {
          label: t("일자별 실제 소모(kcal)", "Actual burn by date (kcal)"),
          data: dailyBurnSeries.map((row) => row.actual),
          borderColor: "#14b8a6",
          backgroundColor: "rgba(20,184,166,0.2)",
          fill: true,
          tension: 0.35
        },
        ...(showTargetOverlay
          ? [
              {
                label: t("일자별 목표 소모(kcal)", "Target burn by date (kcal)"),
                data: dailyBurnSeries.map((row) => row.target),
                borderColor: "rgba(212,212,216,0.9)",
                backgroundColor: "rgba(212,212,216,0.08)",
                borderWidth: 2,
                borderDash: [6, 6],
                pointRadius: 0,
                fill: false,
                tension: 0.25
              }
            ]
          : [])
      ]
    }),
    [dailyBurnSeries, showTargetOverlay, t]
  );

  const modeDoughnutData = useMemo(
    () => ({
      labels: [
        getActivityLabel("walk", locale),
        getActivityLabel("brisk", locale),
        getActivityLabel("run", locale)
      ],
      datasets: [
        {
          label: t("운동 방식 비율", "Activity mode distribution"),
          data: [modeDistribution.walk, modeDistribution.brisk, modeDistribution.run],
          backgroundColor: ["#22c55e", "#f59e0b", "#3b82f6"],
          borderWidth: 0
        }
      ]
    }),
    [locale, modeDistribution, t]
  );

  return (
    <section className="glass-card">
      <h2 className="text-lg font-semibold text-zinc-100">{t("기록 요약 차트", "History summary charts")}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="glass-soft p-4">
          <p className="mb-3 text-sm font-semibold text-zinc-200">
            {t("일자별 소모 칼로리", "Calories burned by date")}
          </p>
          <label className="mb-3 flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={showTargetOverlay}
              onChange={(event) => onToggleTargetOverlay(event.target.checked)}
            />
            {t("목표 소모 kcal 같이 보기", "Show target burn overlay")}
          </label>
          <div className="h-56">
            <Line
              data={burnLineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    ticks: { color: "#a1a1aa" },
                    grid: { color: "rgba(255,255,255,0.08)" }
                  },
                  y: {
                    ticks: { color: "#a1a1aa" },
                    grid: { color: "rgba(255,255,255,0.08)" }
                  }
                }
              }}
            />
          </div>
        </div>
        <div className="glass-soft p-4">
          <p className="mb-3 text-sm font-semibold text-zinc-200">
            {t("운동 방식 분포", "Activity distribution")}
          </p>
          <div className="h-56">
            <Doughnut
              data={modeDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { color: "#d4d4d8" }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
