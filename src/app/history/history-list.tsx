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
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-sm text-zinc-200">
                      <p className="flex items-center gap-2 font-semibold text-zinc-100">
                        <span>
                          {entry.analysis.foodName} | {entry.analysis.kcalAvg} kcal
                        </span>
                        {state === "completed" && (
                          <span className="rounded-full border border-emerald-300/60 bg-emerald-300/15 px-2 py-0.5 text-xs font-medium text-emerald-200">
                            {t("완료", "Done")}
                          </span>
                        )}
                        {state === "missed" && (
                          <span className="rounded-full border border-zinc-500/60 bg-zinc-500/15 px-2 py-0.5 text-xs font-medium text-zinc-400">
                            {t("놓침", "Missed")}
                          </span>
                        )}
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
                    <div className="flex shrink-0 flex-col gap-2">
                      {/* 놓침(missed)은 당일 마감되어 완료 액션을 제공하지 않는다. */}
                      {state !== "missed" && (
                        <ActionButton
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleComplete(entry);
                          }}
                          disabled={togglingId === entry.id}
                          variant={state === "completed" ? "ghost" : "primary"}
                          size="xs"
                          className="py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {state === "completed" ? t("완료 취소", "Undo") : t("했어요", "Mark done")}
                        </ActionButton>
                      )}
                      <ActionButton
                        onClick={(event) => {
                          event.stopPropagation();
                          onRequestDelete(entry);
                        }}
                        variant="danger"
                        size="xs"
                        className="py-1.5"
                      >
                        {t("삭제", "Delete")}
                      </ActionButton>
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
