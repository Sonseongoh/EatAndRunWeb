"use client";

import dynamic from "next/dynamic";
import { ActionButton } from "@/app/components/action-button";
import { deriveCompletionState } from "@/lib/completion";
import { HistoryEntry } from "@/lib/types";

const DynamicGoogleRouteMap = dynamic(
  () => import("@/app/components/google-route-map").then((mod) => mod.GoogleRouteMap),
  { ssr: false }
);

type HistoryDetailModalProps = {
  detailEntry: HistoryEntry | null;
  detailRouteIndex: number;
  isToggling: boolean;
  t: (ko: string, en: string) => string;
  onClose: () => void;
  onSelectRoute: (index: number) => void;
  onToggleComplete: (entry: HistoryEntry) => void;
};

export function HistoryDetailModal({
  detailEntry,
  detailRouteIndex,
  isToggling,
  t,
  onClose,
  onSelectRoute,
  onToggleComplete
}: HistoryDetailModalProps) {
  if (!detailEntry) return null;

  const detailRoute = detailEntry.routes[detailRouteIndex] ?? null;
  const state = deriveCompletionState(detailEntry, new Date());
  const completedAt = detailEntry.completion?.completedAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass-card w-full max-w-4xl space-y-4 border border-white/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">
              {detailEntry.analysis.foodName} {t("경로 상세", "Route details")}
            </h3>
            <p className="mt-1 text-sm text-zinc-300">{new Date(detailEntry.createdAt).toLocaleString()}</p>
          </div>
          <ActionButton onClick={onClose} variant="ghost" size="xs">
            {t("닫기", "Close")}
          </ActionButton>
        </div>

        {/* 완수 상태 + 완료 토글(완료 취소 포함). 카드에선 뺀 완료 취소를 여기서 처리. */}
        <div className="glass-soft flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2 text-sm">
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
            <span className="text-zinc-300">
              {state === "completed"
                ? completedAt
                  ? t(
                      `완료함 · ${new Date(completedAt).toLocaleString()}`,
                      `Completed · ${new Date(completedAt).toLocaleString()}`
                    )
                  : t("완료한 계획입니다.", "This plan is completed.")
                : state === "missed"
                  ? t("당일에 완료하지 못한 계획입니다.", "This plan was not completed that day.")
                  : t("아직 완료하지 않은 계획입니다.", "This plan isn't completed yet.")}
            </span>
          </div>
          {/* 놓침(missed)은 당일 마감되어 완료 액션을 제공하지 않는다. */}
          {state !== "missed" && (
            <ActionButton
              onClick={() => onToggleComplete(detailEntry)}
              disabled={isToggling}
              variant={state === "completed" ? "ghost" : "primary"}
              size="xs"
              className="disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state === "completed" ? t("완료 취소", "Undo") : t("했어요", "Mark done")}
            </ActionButton>
          )}
        </div>

        {detailEntry.routes.length > 1 && (
          <div className="grid gap-2 md:grid-cols-2">
            {detailEntry.routes.map((route, index) => (
              <button
                key={route.id}
                type="button"
                onClick={() => onSelectRoute(index)}
                className={`rounded-lg border px-3 py-2 text-left text-xs ${
                  detailRouteIndex === index
                    ? "border-emerald-300 bg-emerald-300 text-zinc-900"
                    : "border-white/20 bg-zinc-900/60 text-zinc-200"
                }`}
              >
                <p className="font-semibold">{route.name}</p>
                <p>
                  {t("거리", "Distance")} {route.distanceKm}km
                </p>
                <p>
                  {t("예상", "ETA")} {route.estimatedMinutes}
                  {t("분", " min")}
                </p>
              </button>
            ))}
          </div>
        )}

        {detailRoute ? (
          <>
            <div className="glass-soft p-3 text-sm text-zinc-200">
              <p>
                {t("선택 코스", "Selected route")}: <span className="font-semibold">{detailRoute.name}</span>
              </p>
              <p>
                {t("거리", "Distance")} {detailRoute.distanceKm}km | {t("예상", "ETA")}{" "}
                {detailRoute.estimatedMinutes}
                {t("분", " min")} | {t("소모", "Burn")} {detailRoute.expectedBurnKcal}
                kcal
              </p>
            </div>
            <div className="h-[420px] overflow-hidden rounded-xl border border-white/20 bg-zinc-900/60">
              <DynamicGoogleRouteMap center={detailRoute.start} path={detailRoute.path} />
            </div>
          </>
        ) : (
          <div className="glass-soft p-4 text-sm text-zinc-400">
            {t("저장된 경로 정보가 없습니다.", "No saved route data.")}
          </div>
        )}
      </div>
    </div>
  );
}
