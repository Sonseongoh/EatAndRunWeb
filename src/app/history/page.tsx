"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { ActionButton } from "@/app/components/action-button";
import { getActivityLabel } from "@/lib/activity";
import {
  clearHistoryEntries,
  deleteHistoryEntry,
  fetchHistoryEntries,
  seedMockHistoryEntries,
} from "@/lib/api";
import { HistoryEntry } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";

type FilterMode = "all" | "walk" | "brisk" | "run";
type ConfirmAction =
  | { type: "delete-one"; id: string; label: string }
  | { type: "clear-all" };

const PAGE_SIZE = 24;
const DynamicGoogleRouteMap = dynamic(
  () =>
    import("@/app/components/google-route-map").then(
      (mod) => mod.GoogleRouteMap,
    ),
  { ssr: false },
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
);

function formatDateGroup(isoDate: string) {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export default function HistoryPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const showSeedButton = process.env.NODE_ENV !== "production";
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [modeFilter, setModeFilter] = useState<FilterMode>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [detailEntry, setDetailEntry] = useState<HistoryEntry | null>(null);
  const [detailRouteIndex, setDetailRouteIndex] = useState(0);
  const [showTargetOverlay, setShowTargetOverlay] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const historyQuery = useInfiniteQuery({
    queryKey: ["history", { keyword, modeFilter, startDate, endDate }],
    enabled: !isAuthLoading && isAuthenticated,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchHistoryEntries({
        limit: PAGE_SIZE,
        before: pageParam ?? undefined,
        mode: modeFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        keyword: keyword || undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    data,
    isLoading,
    isError,
    error,
  } = historyQuery;

  const deleteMutation = useMutation({
    mutationFn: deleteHistoryEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearHistoryEntries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const seedMutation = useMutation({
    mutationFn: seedMockHistoryEntries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.entries) ?? [],
    [data],
  );
  const detailRoute = detailEntry?.routes[detailRouteIndex] ?? null;

  const grouped = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    entries.forEach((entry) => {
      const key = formatDateGroup(entry.createdAt);
      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [entries]);

  const dailyBurnSeries = useMemo(() => {
    const actualTotals = new Map<string, number>();
    const targetTotals = new Map<string, number>();
    entries.forEach((entry) => {
      const key = formatDateGroup(entry.createdAt);
      const currentActual = actualTotals.get(key) ?? 0;
      const currentTarget = targetTotals.get(key) ?? 0;
      const burn = entry.routes.reduce(
        (sum, route) => sum + (route.expectedBurnKcal ?? 0),
        0,
      );
      actualTotals.set(key, currentActual + burn);
      targetTotals.set(key, currentTarget + (entry.plan?.targetBurnKcal ?? 0));
    });

    const labels = Array.from(
      new Set([...actualTotals.keys(), ...targetTotals.keys()]),
    ).sort((a, b) => a.localeCompare(b));

    return labels.map((date) => ({
      date,
      actual: actualTotals.get(date) ?? 0,
      target: targetTotals.get(date) ?? 0,
    }));
  }, [entries]);

  const modeDistribution = useMemo(() => {
    const counts = { walk: 0, brisk: 0, run: 0 };
    entries.forEach((entry) => {
      const currentMode = entry.plan?.mode;
      if (!currentMode) return;
      counts[currentMode] += 1;
    });
    return counts;
  }, [entries]);

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
          tension: 0.35,
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
                tension: 0.25,
              },
            ]
          : []),
      ],
    }),
    [dailyBurnSeries, showTargetOverlay, t],
  );

  const modeDoughnutData = useMemo(
    () => ({
      labels: [
        getActivityLabel("walk", locale),
        getActivityLabel("brisk", locale),
        getActivityLabel("run", locale),
      ],
      datasets: [
        {
          label: t("운동 방식 비율", "Activity mode distribution"),
          data: [
            modeDistribution.walk,
            modeDistribution.brisk,
            modeDistribution.run,
          ],
          backgroundColor: ["#22c55e", "#f59e0b", "#3b82f6"],
          borderWidth: 0,
        },
      ],
    }),
    [locale, modeDistribution, t],
  );

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        fetchNextPage();
      },
      { rootMargin: "120px 0px", threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isAuthLoading) return null;
  if (!isAuthenticated) return null;

  const isEmpty = !isLoading && entries.length === 0;
  const isConfirmPending = deleteMutation.isPending || clearMutation.isPending;

  function onConfirmDelete() {
    if (!confirmAction) return;

    if (confirmAction.type === "clear-all") {
      clearMutation.mutate(undefined, {
        onSettled: () => setConfirmAction(null),
      });
      return;
    }

    deleteMutation.mutate(confirmAction.id, {
      onSettled: () => setConfirmAction(null),
    });
  }

  function openDetail(entry: HistoryEntry) {
    setDetailEntry(entry);
    setDetailRouteIndex(0);
  }

  return (
    <main className="app-shell md:px-8">
      <section className="glass-card">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">
            {t("운동 기록", "Activity history")}
          </h1>
          <div className="flex items-center gap-2">
            {showSeedButton && (
              <ActionButton
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                variant="ghost"
                size="xs"
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("테스트 데이터 채우기", "Seed test data")}
              </ActionButton>
            )}
            <ActionButton
              onClick={() => setConfirmAction({ type: "clear-all" })}
              disabled={clearMutation.isPending || entries.length === 0}
              variant="danger"
              size="xs"
              className="disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-600"
            >
              {t("전체 삭제", "Delete all")}
            </ActionButton>
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-300">
          {t(
            "Supabase에 저장된 기록을 날짜별로 확인하고, 검색/운동 방식/기간 필터를 적용할 수 있습니다.",
            "View Supabase history by date and use search/activity/date filters."
          )}
        </p>
      </section>

      <section className="glass-card">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {t("검색 및 필터", "Search & filters")}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("음식명 또는 코스명 검색", "Search meal or route name")}
            className="glass-input rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as FilterMode)}
            className="glass-input rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">{t("전체 방식", "All modes")}</option>
            <option value="walk">{getActivityLabel("walk", locale)}</option>
            <option value="brisk">{getActivityLabel("brisk", locale)}</option>
            <option value="run">{getActivityLabel("run", locale)}</option>
          </select>
        </div>

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {t("기간", "Date range")}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="glass-input rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="glass-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <ActionButton
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            variant="ghost"
            size="xs"
            className="py-1.5"
          >
            {t("기간 초기화", "Reset dates")}
          </ActionButton>
        </div>
      </section>

      {entries.length > 0 && (
        <section className="glass-card">
          <h2 className="text-lg font-semibold text-zinc-100">
            {t("기록 요약 차트", "History summary charts")}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="glass-soft p-4">
              <p className="mb-3 text-sm font-semibold text-zinc-200">
                {t("일자별 소모 칼로리", "Calories burned by date")}
              </p>
              <label className="mb-3 flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={showTargetOverlay}
                  onChange={(event) => setShowTargetOverlay(event.target.checked)}
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
                        grid: { color: "rgba(255,255,255,0.08)" },
                      },
                      y: {
                        ticks: { color: "#a1a1aa" },
                        grid: { color: "rgba(255,255,255,0.08)" },
                      },
                    },
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
                        labels: { color: "#d4d4d8" },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {isLoading && (
        <section className="glass-card p-8 text-sm text-zinc-400">
          {t("기록을 불러오는 중입니다...", "Loading history...")}
        </section>
      )}

      {isError && (
        <section className="rounded-2xl border border-red-300/60 bg-red-900/20 p-6 text-sm text-red-300">
          {(error as Error).message}
        </section>
      )}

      {isEmpty && (
        <section className="glass-card p-8 text-sm text-zinc-400">
          {t("조건에 맞는 기록이 없습니다.", "No records match this filter.")}
        </section>
      )}

      {grouped.map(([dateKey, items]) => (
        <section key={dateKey} className="glass-card">
          <h2 className="text-lg font-semibold text-zinc-100">{dateKey}</h2>
          <div className="mt-4 space-y-3">
            {items.map((entry) => {
              const routeBurnKcal = entry.routes.reduce(
                (sum, route) => sum + (route.expectedBurnKcal ?? 0),
                0,
              );
              return (
                <article
                  key={entry.id}
                  className="glass-soft cursor-pointer border border-transparent p-4 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:bg-emerald-300/10 hover:shadow-[0_12px_28px_-16px_rgba(16,185,129,0.85)]"
                  onClick={() => openDetail(entry)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-sm text-zinc-200">
                      <p className="font-semibold text-zinc-100">
                        {entry.analysis.foodName} | {entry.analysis.kcalAvg}{" "}
                        kcal
                      </p>
                      <p className="text-xs text-zinc-400">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </p>
                      <p>
                        {t("목표", "Target")}: {entry.plan?.targetBurnKcal ?? "-"} kcal (
                        {entry.plan?.burnRatioPercent ?? "-"}%)
                      </p>
                      <p>{t("코스 소모", "Route burn")}: {routeBurnKcal} kcal</p>
                      <p>
                        {t("방식", "Mode")}:{" "}
                        {entry.plan?.mode
                          ? getActivityLabel(entry.plan.mode, locale)
                          : t("미기록", "N/A")}{" "}
                        | {t("시간", "Duration")}: {entry.plan?.durationMin ?? "-"}{t("분", " min")}
                      </p>
                      <p>
                        {t("프로필", "Profile")}: {entry.profile.weightKg}kg,{" "}
                        {entry.profile.paceMinPerKm}{t("분/km", " min/km")}
                      </p>
                      <p>
                        {t("경로", "Routes")}:{" "}
                        {entry.routes.map((route) => route.name).join(", ")}
                      </p>
                    </div>
                    <ActionButton
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirmAction({
                          type: "delete-one",
                          id: entry.id,
                          label: `${entry.analysis.foodName} (${new Date(
                            entry.createdAt,
                          ).toLocaleTimeString()})`,
                        });
                      }}
                      variant="danger"
                      size="xs"
                      className="py-1.5"
                    >
                      {t("삭제", "Delete")}
                    </ActionButton>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {entries.length > 0 && (
        <div
          ref={loadMoreRef}
          className="py-2 text-center text-xs text-zinc-400"
        >
          {hasNextPage
            ? isFetchingNextPage
              ? t("기록을 더 불러오는 중입니다...", "Loading more records...")
              : t("아래로 스크롤하면 기록을 더 불러옵니다.", "Scroll down to load more.")
            : t("모든 기록을 불러왔습니다.", "All records loaded.")}
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-md space-y-4 border border-white/20">
            <h3 className="text-lg font-semibold text-zinc-100">{t("삭제 확인", "Confirm deletion")}</h3>
            <p className="text-sm text-zinc-300">
              {confirmAction.type === "clear-all"
                ? t("모든 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.", "Delete all records? This cannot be undone.")
                : t(`해당 기록을 삭제할까요? (${confirmAction.label})`, `Delete this record? (${confirmAction.label})`)}
            </p>
            <div className="flex justify-end gap-2">
              <ActionButton
                onClick={() => setConfirmAction(null)}
                variant="ghost"
                size="xs"
                disabled={isConfirmPending}
              >
                {t("취소", "Cancel")}
              </ActionButton>
              <ActionButton
                onClick={onConfirmDelete}
                variant="danger"
                size="xs"
                disabled={isConfirmPending}
              >
                {isConfirmPending ? t("삭제 중...", "Deleting...") : t("삭제하기", "Delete")}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {detailEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-card w-full max-w-4xl space-y-4 border border-white/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">
                  {detailEntry.analysis.foodName} {t("경로 상세", "Route details")}
                </h3>
                <p className="mt-1 text-sm text-zinc-300">
                  {new Date(detailEntry.createdAt).toLocaleString()}
                </p>
              </div>
              <ActionButton
                onClick={() => setDetailEntry(null)}
                variant="ghost"
                size="xs"
              >
                {t("닫기", "Close")}
              </ActionButton>
            </div>

            {detailEntry.routes.length > 1 && (
              <div className="grid gap-2 md:grid-cols-2">
                {detailEntry.routes.map((route, index) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setDetailRouteIndex(index)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs ${
                      detailRouteIndex === index
                        ? "border-emerald-300 bg-emerald-300 text-zinc-900"
                        : "border-white/20 bg-zinc-900/60 text-zinc-200"
                    }`}
                  >
                    <p className="font-semibold">{route.name}</p>
                    <p>{t("거리", "Distance")} {route.distanceKm}km</p>
                    <p>{t("예상", "ETA")} {route.estimatedMinutes}{t("분", " min")}</p>
                  </button>
                ))}
              </div>
            )}

            {detailRoute ? (
              <>
                <div className="glass-soft p-3 text-sm text-zinc-200">
                  <p>
                    {t("선택 코스", "Selected route")}:{" "}
                    <span className="font-semibold">{detailRoute.name}</span>
                  </p>
                  <p>
                    {t("거리", "Distance")} {detailRoute.distanceKm}km | {t("예상", "ETA")}{" "}
                    {detailRoute.estimatedMinutes}{t("분", " min")} | {t("소모", "Burn")}{" "}
                    {detailRoute.expectedBurnKcal}kcal
                  </p>
                </div>
                <div className="h-[420px] overflow-hidden rounded-xl border border-white/20 bg-zinc-900/60">
                  <DynamicGoogleRouteMap
                    center={detailRoute.start}
                    path={detailRoute.path}
                  />
                </div>
              </>
            ) : (
              <div className="glass-soft p-4 text-sm text-zinc-400">
                {t("저장된 경로 정보가 없습니다.", "No saved route data.")}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
