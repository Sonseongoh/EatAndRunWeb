"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { ActionButton } from "@/app/components/action-button";
import {
  clearHistoryEntries,
  deleteHistoryEntry,
  fetchHistoryEntries,
  HistoryListResponse,
  seedMockHistoryEntries,
  setHistoryCompletion
} from "@/lib/api";
import { computeCompletionRate, computeStreak, selectPendingToday } from "@/lib/completion";
import { getErrorMessage } from "@/lib/error-message";
import { HistoryEntry } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { HistoryDeleteDialog } from "./history-delete-dialog";
import { HistoryDetailModal } from "./history-detail-modal";
import { HistoryFilters } from "./history-filters";
import { HistoryCompletionRate } from "./history-completion-rate";
import { HistoryList } from "./history-list";
import { HistoryTodayPending } from "./history-today-pending";
import { ConfirmAction, FilterMode } from "./history-view-types";

// 차트는 기록이 있을 때만 렌더되므로 chart.js 번들을 지연 로드한다.
// (빈 기록/첫 진입 시 무거운 차트 라이브러리 다운로드를 피함)
const HistorySummaryCharts = dynamic(
  () => import("./history-summary-charts").then((m) => m.HistorySummaryCharts),
  { ssr: false }
);

const PAGE_SIZE = 24;

export default function HistoryPage() {
  const { t, locale } = useLocale();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const showSeedButton = process.env.NODE_ENV !== "production";
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [modeFilter, setModeFilter] = useState<FilterMode>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [detailEntry, setDetailEntry] = useState<HistoryEntry | null>(null);
  const [detailRouteIndex, setDetailRouteIndex] = useState(0);
  const [showTargetOverlay, setShowTargetOverlay] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
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
  const { fetchNextPage, hasNextPage, isFetchingNextPage, data, isLoading, isError, error } = historyQuery;

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

  const completeMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      setHistoryCompletion(id, completed),
    // 낙관적 업데이트: 토글을 즉시 반영하고, 실패하면 직전 캐시로 롤백한다.
    onMutate: async ({ id, completed }) => {
      setCompletionError(null);
      await queryClient.cancelQueries({ queryKey: ["history"] });
      const previous = queryClient.getQueriesData<InfiniteData<HistoryListResponse>>({
        queryKey: ["history"]
      });
      const completedAt = new Date().toISOString();
      queryClient.setQueriesData<InfiniteData<HistoryListResponse>>(
        { queryKey: ["history"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              entries: page.entries.map((entry) =>
                entry.id === id
                  ? { ...entry, completion: completed ? { completedAt } : undefined }
                  : entry
              )
            }))
          };
        }
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      setCompletionError(getErrorMessage(error, "완료 상태 변경에 실패했습니다."));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    }
  });

  const entries = useMemo(() => data?.pages.flatMap((page) => page.entries) ?? [], [data]);
  const pendingToday = useMemo(() => selectPendingToday(entries, new Date()), [entries]);
  const streak = useMemo(() => computeStreak(entries, new Date()), [entries]);
  const completionRate = useMemo(() => computeCompletionRate(entries, new Date()), [entries]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        if (!observerEntries[0]?.isIntersecting) return;
        fetchNextPage();
      },
      { rootMargin: "120px 0px", threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isAuthLoading) {
    return (
      <main className="app-shell md:px-8">
        <section className="glass-card flex min-h-[320px] flex-col items-center justify-center gap-5 text-center">
          <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-emerald-200/30 border-t-emerald-300" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">{t("활동 기록", "Activity history")}</h1>
            <p className="text-sm text-zinc-300">{t("불러오는 중입니다...", "Loading...")}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="app-shell md:px-8">
        <section className="glass-card space-y-6">
          <header className="space-y-3 text-center">
            <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">{t("활동 기록", "Activity history")}</h1>
            <p className="mx-auto max-w-3xl text-sm leading-relaxed text-zinc-300">
              {t(
                "음식을 찍고 계획을 세우는 건 절반입니다. 로그인하면 그 계획을 실제로 했는지 추적하고, 매일의 연속 기록과 완수율로 이어갈 수 있습니다.",
                "Snapping a meal and making a plan is only half. Sign in to track whether you actually did it, and keep it going with daily streaks and your completion rate."
              )}
            </p>
          </header>

          <div className="grid gap-3 md:grid-cols-3">
            <article className="glass-soft space-y-2 p-4">
              <p className="text-sm font-semibold text-white">🔥 {t("매일 연속 기록", "Daily streak")}</p>
              <p className="text-sm leading-relaxed text-zinc-300">
                {t(
                  "완수한 날이 이어질수록 연속 기록(streak)이 쌓입니다. 오늘도 끊지 마세요.",
                  "Your streak grows with every day you complete. Don't break it today."
                )}
              </p>
            </article>
            <article className="glass-soft space-y-2 p-4">
              <p className="text-sm font-semibold text-white">✅ {t("완수 체크", "Mark it done")}</p>
              <p className="text-sm leading-relaxed text-zinc-300">
                {t(
                  "계획한 운동을 실제로 했으면 1탭으로 완료. 한 일과 못 한 일이 한눈에 정리됩니다.",
                  "Did the workout? Mark it done in one tap. See at a glance what you did and didn't."
                )}
              </p>
            </article>
            <article className="glass-soft space-y-2 p-4">
              <p className="text-sm font-semibold text-white">📊 {t("완수율", "Completion rate")}</p>
              <p className="text-sm leading-relaxed text-zinc-300">
                {t(
                  "결심한 계획 중 몇 %를 실제로 해냈는지. 측정해야 바뀝니다.",
                  "What share of your plans you actually completed. You change what you measure."
                )}
              </p>
            </article>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-wrap justify-center gap-3">
              <ActionButton href="/login" variant="primary" size="sm">
                {t("로그인하고 시작", "Sign in to start")}
              </ActionButton>
              <ActionButton href="/faq" variant="ghost" size="sm">
                {t("기능 안내", "How it works")}
              </ActionButton>
            </div>
            <p className="text-xs text-zinc-400">
              {t(
                "지금까지 만든 기록도 로그인하면 그대로 이어집니다.",
                "The records you've already made carry over when you sign in."
              )}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const isEmpty = !isLoading && entries.length === 0;
  const isConfirmPending = deleteMutation.isPending || clearMutation.isPending;

  function openDetail(entry: HistoryEntry) {
    setDetailEntry(entry);
    setDetailRouteIndex(0);
  }

  function toggleComplete(entry: HistoryEntry) {
    completeMutation.mutate({ id: entry.id, completed: !entry.completion });
  }

  function requestDelete(entry: HistoryEntry) {
    setConfirmAction({
      type: "delete-one",
      id: entry.id,
      label: `${entry.analysis.foodName} (${new Date(entry.createdAt).toLocaleTimeString()})`
    });
  }

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">{t("활동 기록", "Activity history")}</h1>
            {streak > 0 && (
              <span
                className="rounded-full border border-amber-300/60 bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-200"
                title={t("연속 완수 일수", "Completion streak")}
              >
                🔥 {t(`${streak}일 연속`, `${streak}-day streak`)}
              </span>
            )}
          </div>
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
            "Supabase에 저장된 기록을 날짜별로 확인하고, 검색과 운동 방식/기간 필터를 적용할 수 있습니다.",
            "View Supabase history by date and use search/activity/date filters."
          )}
        </p>
      </section>

      <HistoryTodayPending
        entries={pendingToday}
        locale={locale}
        t={t}
        onComplete={toggleComplete}
        togglingId={completeMutation.isPending ? completeMutation.variables?.id ?? null : null}
      />

      <HistoryFilters
        keyword={keyword}
        modeFilter={modeFilter}
        startDate={startDate}
        endDate={endDate}
        locale={locale}
        t={t}
        onKeywordChange={setKeyword}
        onModeChange={setModeFilter}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onResetDates={() => {
          setStartDate("");
          setEndDate("");
        }}
      />

      {entries.length > 0 && <HistoryCompletionRate rate={completionRate} t={t} />}

      {entries.length > 0 && (
        <HistorySummaryCharts
          entries={entries}
          locale={locale}
          t={t}
          showTargetOverlay={showTargetOverlay}
          onToggleTargetOverlay={setShowTargetOverlay}
        />
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

      {completionError && (
        <section className="rounded-2xl border border-red-300/60 bg-red-900/20 p-4 text-sm text-red-300">
          {completionError}
        </section>
      )}

      <HistoryList
        entries={entries}
        locale={locale}
        t={t}
        onOpenDetail={openDetail}
        onRequestDelete={requestDelete}
        onToggleComplete={toggleComplete}
        togglingId={completeMutation.isPending ? completeMutation.variables?.id ?? null : null}
      />

      {entries.length > 0 && (
        <div ref={loadMoreRef} className="py-2 text-center text-xs text-zinc-400">
          {hasNextPage
            ? isFetchingNextPage
              ? t("기록을 더 불러오는 중입니다...", "Loading more records...")
              : t("아래로 스크롤하면 기록을 더 불러옵니다.", "Scroll down to load more.")
            : t("모든 기록을 불러왔습니다.", "All records loaded.")}
        </div>
      )}

      <HistoryDeleteDialog
        confirmAction={confirmAction}
        isPending={isConfirmPending}
        t={t}
        onClose={() => setConfirmAction(null)}
        onConfirm={onConfirmDelete}
      />

      <HistoryDetailModal
        detailEntry={detailEntry}
        detailRouteIndex={detailRouteIndex}
        t={t}
        onClose={() => setDetailEntry(null)}
        onSelectRoute={setDetailRouteIndex}
      />
    </main>
  );
}
