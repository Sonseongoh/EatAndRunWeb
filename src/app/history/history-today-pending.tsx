"use client";

import { ActionButton } from "@/app/components/action-button";
import { getActivityLabel } from "@/lib/activity";
import { HistoryEntry } from "@/lib/types";

type HistoryTodayPendingProps = {
  entries: HistoryEntry[];
  locale: "ko" | "en";
  t: (ko: string, en: string) => string;
  onComplete: (entry: HistoryEntry) => void;
  togglingId?: string | null;
};

// 재방문 시 가장 먼저 직면하는 "오늘의 미완료 계획" 패널.
// 대상이 없으면 아무것도 렌더하지 않는다(불필요한 방해 금지).
export function HistoryTodayPending({
  entries,
  locale,
  t,
  onComplete,
  togglingId
}: HistoryTodayPendingProps) {
  if (entries.length === 0) return null;

  return (
    <section className="glass-card border border-emerald-300/40">
      <h2 className="text-lg font-semibold text-emerald-100">
        {t("오늘 아직 안 한 계획", "Today's plans you haven't done")}
      </h2>
      <p className="mt-1 text-sm text-zinc-300">
        {t("오늘 만든 계획을 끝내고 완료로 닫아보세요.", "Finish today's plans and close them out.")}
      </p>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="glass-soft flex items-center justify-between gap-3 p-4"
          >
            <div className="space-y-1 text-sm text-zinc-200">
              <p className="font-semibold text-zinc-100">
                {entry.analysis.foodName} | {entry.analysis.kcalAvg} kcal
              </p>
              <p className="text-xs text-zinc-400">
                {t("방식", "Mode")}:{" "}
                {entry.plan?.mode ? getActivityLabel(entry.plan.mode, locale) : t("미기록", "N/A")}{" "}
                | {t("시간", "Duration")}: {entry.plan?.durationMin ?? "-"}
                {t("분", " min")}
              </p>
            </div>
            <ActionButton
              onClick={() => onComplete(entry)}
              disabled={togglingId === entry.id}
              variant="primary"
              size="xs"
              className="shrink-0 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("했어요", "Mark done")}
            </ActionButton>
          </article>
        ))}
      </div>
    </section>
  );
}
