"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  clearHistoryEntries,
  deleteHistoryEntry,
  fetchHistoryEntries,
  seedMockHistoryEntries
} from "@/lib/api";
import { HistoryEntry } from "@/lib/types";

type FilterMode = "all" | "walk" | "brisk" | "run";

const PAGE_SIZE = 24;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

function formatDateGroup(isoDate: string) {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [modeFilter, setModeFilter] = useState<FilterMode>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const historyQuery = useInfiniteQuery({
    queryKey: ["history", { keyword, modeFilter, startDate, endDate }],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchHistoryEntries({
        limit: PAGE_SIZE,
        before: pageParam ?? undefined,
        mode: modeFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        keyword: keyword || undefined
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  });
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    data,
    isLoading,
    isError,
    error
  } = historyQuery;

  const deleteMutation = useMutation({
    mutationFn: deleteHistoryEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    }
  });

  const clearMutation = useMutation({
    mutationFn: clearHistoryEntries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    }
  });

  const seedMutation = useMutation({
    mutationFn: seedMockHistoryEntries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    }
  });

  const entries = useMemo(() => data?.pages.flatMap((page) => page.entries) ?? [], [data]);

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
    const totals = new Map<string, number>();
    entries.forEach((entry) => {
      const key = formatDateGroup(entry.createdAt);
      const current = totals.get(key) ?? 0;
      const burn = entry.plan?.targetBurnKcal ?? 0;
      totals.set(key, current + burn);
    });

    return Array.from(totals.entries()).sort((a, b) => a[0].localeCompare(b[0]));
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
      labels: dailyBurnSeries.map(([date]) => date),
      datasets: [
        {
          label: "일자별 목표 소모(kcal)",
          data: dailyBurnSeries.map(([, kcal]) => kcal),
          borderColor: "#14b8a6",
          backgroundColor: "rgba(20,184,166,0.2)",
          fill: true,
          tension: 0.35
        }
      ]
    }),
    [dailyBurnSeries]
  );

  const modeDoughnutData = useMemo(
    () => ({
      labels: ["걷기", "빠른걸음", "달리기"],
      datasets: [
        {
          label: "운동 방식 비율",
          data: [modeDistribution.walk, modeDistribution.brisk, modeDistribution.run],
          backgroundColor: ["#22c55e", "#f59e0b", "#3b82f6"],
          borderWidth: 0
        }
      ]
    }),
    [modeDistribution]
  );

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        fetchNextPage();
      },
      { rootMargin: "120px 0px", threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const isEmpty = !isLoading && entries.length === 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10 md:px-8">
      <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">운동 기록</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="rounded-lg border border-mint-400 px-3 py-2 text-xs font-semibold text-mint-700 hover:bg-mint-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              테스트 데이터 채우기
            </button>
            <button
              type="button"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending || entries.length === 0}
              className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
            >
              전체 삭제
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Supabase에 저장된 기록을 날짜별로 확인하고, 검색/운동 방식/기간 필터를 적용할 수 있습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">검색 및 필터</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="음식명 또는 코스명 검색"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as FilterMode)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">전체 방식</option>
            <option value="walk">걷기</option>
            <option value="brisk">빠른걸음</option>
            <option value="run">달리기</option>
          </select>
        </div>

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">기간</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            기간 초기화
          </button>
        </div>
      </section>

      {entries.length > 0 && (
        <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">기록 요약 차트</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">일자별 목표 소모 칼로리</p>
              <div className="h-56">
                <Line
                  data={burnLineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                  }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">운동 방식 분포</p>
              <div className="h-56">
                <Doughnut
                  data={modeDoughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom" } }
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {isLoading && (
        <section className="rounded-2xl border border-white/70 bg-white/80 p-8 text-sm text-slate-500 shadow-sm">
          기록을 불러오는 중입니다...
        </section>
      )}

      {isError && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {(error as Error).message}
        </section>
      )}

      {isEmpty && (
        <section className="rounded-2xl border border-white/70 bg-white/80 p-8 text-sm text-slate-500 shadow-sm">
          조건에 맞는 기록이 없습니다.
        </section>
      )}

      {grouped.map(([dateKey, items]) => (
        <section key={dateKey} className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{dateKey}</h2>
          <div className="mt-4 space-y-3">
            {items.map((entry) => (
              <article key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">
                      {entry.analysis.foodName} | {entry.analysis.kcalAvg} kcal
                    </p>
                    <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleTimeString()}</p>
                    <p>
                      목표: {entry.plan?.targetBurnKcal ?? "-"} kcal ({entry.plan?.burnRatioPercent ?? "-"}%)
                    </p>
                    <p>
                      방식: {entry.plan?.mode ? getActivityLabel(entry.plan.mode) : "미기록"} | 시간: {entry.plan?.durationMin ?? "-"}분
                    </p>
                    <p>
                      프로필: {entry.profile.weightKg}kg, {entry.profile.paceMinPerKm}분/km
                    </p>
                    <p>경로: {entry.routes.map((route) => route.name).join(", ")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(entry.id)}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600"
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {entries.length > 0 && (
        <div ref={loadMoreRef} className="py-2 text-center text-xs text-slate-500">
          {hasNextPage
            ? isFetchingNextPage
              ? "기록을 더 불러오는 중입니다..."
              : "아래로 스크롤하면 기록을 더 불러옵니다."
            : "모든 기록을 불러왔습니다."}
        </div>
      )}
    </main>
  );
}
