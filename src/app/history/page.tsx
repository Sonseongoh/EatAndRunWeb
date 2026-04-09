"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/app/components/action-button";
import {
  clearHistoryEntries,
  deleteHistoryEntry,
  fetchHistoryEntries,
  seedMockHistoryEntries
} from "@/lib/api";
import { HistoryEntry } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { HistoryDeleteDialog } from "./history-delete-dialog";
import { HistoryDetailModal } from "./history-detail-modal";
import { HistoryFilters } from "./history-filters";
import { HistoryList } from "./history-list";
import { HistorySummaryCharts } from "./history-summary-charts";
import { ConfirmAction, FilterMode } from "./history-view-types";

const PAGE_SIZE = 24;

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
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
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

  const entries = useMemo(() => data?.pages.flatMap((page) => page.entries) ?? [], [data]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthLoading, isAuthenticated, router]);

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

  if (isAuthLoading) return null;
  if (!isAuthenticated) return null;

  const isEmpty = !isLoading && entries.length === 0;
  const isConfirmPending = deleteMutation.isPending || clearMutation.isPending;

  function openDetail(entry: HistoryEntry) {
    setDetailEntry(entry);
    setDetailRouteIndex(0);
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
          <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">{t("운동 기록", "Activity history")}</h1>
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

      <HistoryList entries={entries} locale={locale} t={t} onOpenDetail={openDetail} onRequestDelete={requestDelete} />

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
