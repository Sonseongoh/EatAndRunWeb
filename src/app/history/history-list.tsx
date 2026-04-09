"use client";

import { ActionButton } from "@/app/components/action-button";
import { getActivityLabel } from "@/lib/activity";
import { HistoryEntry } from "@/lib/types";
import { groupEntriesByDate } from "./history-utils";

type HistoryListProps = {
  entries: HistoryEntry[];
  locale: "ko" | "en";
  t: (ko: string, en: string) => string;
  onOpenDetail: (entry: HistoryEntry) => void;
  onRequestDelete: (entry: HistoryEntry) => void;
};

export function HistoryList({
  entries,
  locale,
  t,
  onOpenDetail,
  onRequestDelete
}: HistoryListProps) {
  const grouped = groupEntriesByDate(entries);

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
              return (
                <article
                  key={entry.id}
                  className="glass-soft cursor-pointer border border-transparent p-4 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:bg-emerald-300/10 hover:shadow-[0_12px_28px_-16px_rgba(16,185,129,0.85)]"
                  onClick={() => onOpenDetail(entry)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-sm text-zinc-200">
                      <p className="font-semibold text-zinc-100">
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
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
