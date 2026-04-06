"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { ActionButton } from "@/app/components/action-button";
import { getActivityLabel } from "@/lib/activity";
import {
  clearHistoryEntries,
  deleteHistoryEntry,
  fetchHistoryEntries,
  seedMockHistoryEntries
} from "@/lib/api";
import { HistoryEntry } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";

type FilterMode = "all" | "walk" | "brisk" | "run";
type ConfirmAction =
  | { type: "delete-one"; id: string; label: string }
  | { type: "clear-all" };

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
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const showSeedButton = process.env.NODE_ENV !== "production";
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [modeFilter, setModeFilter] = useState<FilterMode>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
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
      { rootMargin: "120px 0px", threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const isEmpty = !isLoading && entries.length === 0;
  const isConfirmPending = deleteMutation.isPending || clearMutation.isPending;

  function onConfirmDelete() {
    if (!confirmAction) return;

    if (confirmAction.type === "clear-all") {
      clearMutation.mutate(undefined, {
        onSettled: () => setConfirmAction(null)
      });
      return;
    }

    deleteMutation.mutate(confirmAction.id, {
      onSettled: () => setConfirmAction(null)
    });
  }

  return (
    <main className="app-shell md:px-8">
      <section className="glass-card">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">운동 기록</h1>
          <div className="flex items-center gap-2">
            {showSeedButton && (
              <ActionButton
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                variant="ghost"
                size="xs"
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                테스트 데이터 채우기
              </ActionButton>
            )}
            <ActionButton
              onClick={() => setConfirmAction({ type: "clear-all" })}
              disabled={clearMutation.isPending || entries.length === 0}
              variant="danger"
              size="xs"
              className="disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-600"
            >
              전체 삭제
            </ActionButton>
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-300">
          Supabase에 저장된 기록을 날짜별로 확인하고, 검색/운동 방식/기간 필터를 적용할 수 있습니다.
        </p>
      </section>

      <section className="glass-card">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">검색 및 필터</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="음식명 또는 코스명 검색"
            className="glass-input rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as FilterMode)}
            className="glass-input rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">전체 방식</option>
            <option value="walk">걷기</option>
            <option value="brisk">빠른걸음</option>
            <option value="run">달리기</option>
          </select>
        </div>

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">기간</p>
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
            기간 초기화
          </ActionButton>
        </div>
      </section>

      {entries.length > 0 && (
        <section className="glass-card">
          <h2 className="text-lg font-semibold text-zinc-100">기록 요약 차트</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="glass-soft p-4">
              <p className="mb-3 text-sm font-semibold text-zinc-200">일자별 목표 소모 칼로리</p>
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
              <p className="mb-3 text-sm font-semibold text-zinc-200">운동 방식 분포</p>
              <div className="h-56">
                <Doughnut
                  data={modeDoughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom", labels: { color: "#d4d4d8" } }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {isLoading && (
        <section className="glass-card p-8 text-sm text-zinc-400">
          기록을 불러오는 중입니다...
        </section>
      )}

      {isError && (
        <section className="rounded-2xl border border-red-300/60 bg-red-900/20 p-6 text-sm text-red-300">
          {(error as Error).message}
        </section>
      )}

      {isEmpty && (
        <section className="glass-card p-8 text-sm text-zinc-400">
          조건에 맞는 기록이 없습니다.
        </section>
      )}

      {grouped.map(([dateKey, items]) => (
        <section key={dateKey} className="glass-card">
          <h2 className="text-lg font-semibold text-zinc-100">{dateKey}</h2>
          <div className="mt-4 space-y-3">
            {items.map((entry) => (
              <article key={entry.id} className="glass-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 text-sm text-zinc-200">
                    <p className="font-semibold text-zinc-100">
                      {entry.analysis.foodName} | {entry.analysis.kcalAvg} kcal
                    </p>
                    <p className="text-xs text-zinc-400">{new Date(entry.createdAt).toLocaleTimeString()}</p>
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
                  <ActionButton
                    onClick={() =>
                      setConfirmAction({
                        type: "delete-one",
                        id: entry.id,
                        label: `${entry.analysis.foodName} (${new Date(
                          entry.createdAt
                        ).toLocaleTimeString()})`
                      })
                    }
                    variant="danger"
                    size="xs"
                    className="py-1.5"
                  >
                    삭제
                  </ActionButton>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {entries.length > 0 && (
        <div ref={loadMoreRef} className="py-2 text-center text-xs text-zinc-400">
          {hasNextPage
            ? isFetchingNextPage
              ? "기록을 더 불러오는 중입니다..."
              : "아래로 스크롤하면 기록을 더 불러옵니다."
            : "모든 기록을 불러왔습니다."}
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-md space-y-4 border border-white/20">
            <h3 className="text-lg font-semibold text-zinc-100">삭제 확인</h3>
            <p className="text-sm text-zinc-300">
              {confirmAction.type === "clear-all"
                ? "모든 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다."
                : `해당 기록을 삭제할까요? (${confirmAction.label})`}
            </p>
            <div className="flex justify-end gap-2">
              <ActionButton
                onClick={() => setConfirmAction(null)}
                variant="ghost"
                size="xs"
                disabled={isConfirmPending}
              >
                취소
              </ActionButton>
              <ActionButton
                onClick={onConfirmDelete}
                variant="danger"
                size="xs"
                disabled={isConfirmPending}
              >
                {isConfirmPending ? "삭제 중..." : "삭제하기"}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
