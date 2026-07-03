"use client";

import { ActionButton } from "@/app/components/action-button";
import { getActivityLabel } from "@/lib/activity";
import { deriveCompletionState } from "@/lib/completion";
import { HistoryEntry } from "@/lib/types";
import { groupEntriesByDate } from "./history-utils";

type HistoryListProps = {
  entries: HistoryEntry[];
  locale: "ko" | "en";
  t: (ko: string, en: string) => string;
  onOpenDetail: (entry: HistoryEntry) => void;
  onRequestDelete: (entry: HistoryEntry) => void;
  onToggleComplete: (entry: HistoryEntry) => void;
  togglingId?: string | null;
};

export function HistoryList({
  entries,
  locale,
  t,
  onOpenDetail,
  onRequestDelete,
  onToggleComplete,
  togglingId
}: HistoryListProps) {
  const grouped = groupEntriesByDate(entries);
  const now = new Date();

  return (
    <>
      {grouped.map(([dateKey, items]) => (
        <section key={dateKey} className="glass-card">
          <h2 className="text-lg font-semibold text-zinc-100">{dateKey}</h2>
          <div className="mt-4 space-y-3">
            {items.map((entry) => {
              const routeBurnKcal = entry.routes.reduce(
                (sum, route) => sum + (route.expectedBurnKcal ?? 0),
                0
              );
              const state = deriveCompletionState(entry, now);
              return (
                <article
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  aria-label={t("기록 상세 보기", "View record detail")}
                  className="glass-soft cursor-pointer border border-transparent p-4 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:bg-emerald-300/10 hover:shadow-[0_12px_28px_-16px_rgba(16,185,129,0.85)] focus:outline-none focus-visible:border-emerald-300/60 focus-visible:ring-2 focus-visible:ring-emerald-300/40"
                  onClick={() => onOpenDetail(entry)}
                  onKeyDown={(event) => {
                    // 카드 본체에 포커스가 있을 때만 동작. 내부 삭제 버튼에서 누른
                    // Enter/Space가 상세 열기로 번지지 않도록 차단.
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenDetail(entry);
                    }
                  }}
                >
                  <div className="flex items-stretch justify-between gap-3">
                    <div className="min-w-0 space-y-1 text-sm text-zinc-200">
                      <p className="break-keep font-semibold text-zinc-100">
                        {entry.analysis.foodName} | {entry.analysis.kcalAvg} kcal
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
                        | {t("시간", "Duration")}: {entry.plan?.durationMin ?? "-"}
                        {t("분", " min")}
                      </p>
                      <p>
                        {t("프로필", "Profile")}: {entry.profile.weightKg}kg, {entry.profile.paceMinPerKm}
                        {t("분/km", " min/km")}
                      </p>
                      <p>
                        {t("경로", "Routes")}: {entry.routes.map((route) => route.name).join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-3 self-stretch">
                      {/* 우측 상단: 완수 상태 배지 + 완료 토글 */}
                      <div className="flex flex-col items-end gap-2">
                        {state === "completed" && (
                          <span className="shrink-0 whitespace-nowrap rounded-full border border-emerald-300/60 bg-emerald-300/15 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                            {t("완료", "Done")}
                          </span>
                        )}
                        {state === "missed" && (
                          <span className="shrink-0 whitespace-nowrap rounded-full border border-zinc-500/60 bg-zinc-500/15 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                            {t("놓침", "Missed")}
                          </span>
                        )}
                        {/* 오늘 미완료만 카드에서 바로 완료 처리. 완료 취소는 상세에서. */}
                        {state === "pending" && (
                          <ActionButton
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleComplete(entry);
                            }}
                            disabled={togglingId === entry.id}
                            variant="primary"
                            size="xs"
                            className="py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t("했어요", "Mark done")}
                          </ActionButton>
                        )}
                      </div>

                      {/* 우측 하단: 삭제(파괴적·보조 액션이라 아이콘으로 축소) */}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRequestDelete(entry);
                        }}
                        aria-label={t("삭제", "Delete")}
                        title={t("삭제", "Delete")}
                        className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
