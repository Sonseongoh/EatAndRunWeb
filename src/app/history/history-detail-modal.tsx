"use client";

import dynamic from "next/dynamic";
import { ActionButton } from "@/app/components/action-button";
import { HistoryEntry } from "@/lib/types";

const DynamicGoogleRouteMap = dynamic(
  () => import("@/app/components/google-route-map").then((mod) => mod.GoogleRouteMap),
  { ssr: false }
);

type HistoryDetailModalProps = {
  detailEntry: HistoryEntry | null;
  detailRouteIndex: number;
  t: (ko: string, en: string) => string;
  onClose: () => void;
  onSelectRoute: (index: number) => void;
};

export function HistoryDetailModal({
  detailEntry,
  detailRouteIndex,
  t,
  onClose,
  onSelectRoute
}: HistoryDetailModalProps) {
  if (!detailEntry) return null;

  const detailRoute = detailEntry.routes[detailRouteIndex] ?? null;

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
