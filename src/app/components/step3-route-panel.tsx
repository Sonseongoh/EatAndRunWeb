"use client";

import dynamic from "next/dynamic";
import { ActionButton } from "@/app/components/action-button";
import { RouteRecommendation } from "@/lib/types";

const DynamicGoogleRouteMap = dynamic(
  () => import("./google-route-map").then((mod) => mod.GoogleRouteMap),
  { ssr: false }
);

type Step3RoutePanelProps = {
  routes: RouteRecommendation[];
  selectedRouteIndex: number;
  center: { lat: number; lng: number };
  path: Array<{ lat: number; lng: number }>;
  isPending: boolean;
  isError: boolean;
  errorMessage: string;
  t: (ko: string, en: string) => string;
  onRetry: () => void;
  onSelectRoute: (index: number) => void;
};

export function Step3RoutePanel({
  routes,
  selectedRouteIndex,
  center,
  path,
  isPending,
  isError,
  errorMessage,
  t,
  onRetry,
  onSelectRoute
}: Step3RoutePanelProps) {
  return (
    <>
      {isPending && routes.length === 0 && (
        <p className="text-sm text-zinc-400">{t("경로를 불러오는 중입니다...", "Loading routes...")}</p>
      )}
      {isError && routes.length === 0 && (
        <div className="space-y-2">
          <p className="text-sm text-red-300">{errorMessage}</p>
          <ActionButton onClick={onRetry} variant="ghost" size="xs">
            {t("경로 다시 시도", "Retry route")}
          </ActionButton>
        </div>
      )}

      {!routes.length ? (
        <div className="h-[420px] overflow-hidden rounded-xl border border-white/20 bg-zinc-900/60">
          <DynamicGoogleRouteMap center={center} path={[]} />
        </div>
      ) : (
        <>
          <div className="grid gap-2 md:grid-cols-2">
            {routes.map((route, index) => {
              const burnPerKm = route.expectedBurnKcal / Math.max(route.distanceKm, 0.1);
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => onSelectRoute(index)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs ${
                    selectedRouteIndex === index
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
                  <p>
                    {t("소모", "Burn")} {route.expectedBurnKcal}kcal ({burnPerKm.toFixed(1)} kcal/km)
                  </p>
                </button>
              );
            })}
          </div>

          <div className="h-[420px] overflow-hidden rounded-xl border border-white/20 bg-zinc-900/60">
            <DynamicGoogleRouteMap center={center} path={path} />
          </div>
        </>
      )}
    </>
  );
}
