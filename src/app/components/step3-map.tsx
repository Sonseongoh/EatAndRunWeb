"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/app/components/action-button";
import { getActivityLabel } from "@/lib/activity";
import { recommendRunningRoutes, saveHistoryEntry } from "@/lib/api";
import { calcAverageKcal } from "@/lib/running";
import { useFlowStore } from "@/store/use-flow-store";
import { useRunProfileStore } from "@/store/use-run-profile-store";

const DynamicGoogleRouteMap = dynamic(
  () => import("./google-route-map").then((mod) => mod.GoogleRouteMap),
  { ssr: false }
);

export function Step3Map() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    analysis,
    mode,
    durationMin,
    routes,
    selectedRouteIndex,
    setSelectedRouteIndex,
    setRoutes
  } = useFlowStore();
  const { setStart, burnRatioPercent, startLat, startLng, weightKg, paceMinPerKm } =
    useRunProfileStore();
  const [saveError, setSaveError] = useState("");
  const savedKeyRef = useRef<string>("");

  const routeMutation = useMutation({
    mutationFn: recommendRunningRoutes
  });
  const saveMutation = useMutation({
    mutationFn: saveHistoryEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: (error: unknown) => {
      setSaveError(
        error instanceof Error
          ? error.message
          : "기록 저장에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
      savedKeyRef.current = "";
    }
  });

  const targetBurnKcal = analysis
    ? Math.max(1, Math.round((analysis.kcalAvg * burnRatioPercent) / 100))
    : 0;

  useEffect(() => {
    if (!analysis || !mode || !durationMin) router.replace("/");
  }, [analysis, durationMin, mode, router]);

  useEffect(() => {
    if (!analysis || !mode || !durationMin) return;
    if (routes.length > 0 || routeMutation.isPending) return;

    routeMutation.mutate(
      {
        startLat,
        startLng,
        targetKcal: Math.max(
          1,
          Math.round(
            (calcAverageKcal(analysis.kcalMin, analysis.kcalMax) * burnRatioPercent) / 100
          )
        ),
        weightKg,
        paceMinPerKm,
        targetDurationMin: durationMin
      },
      {
        onSuccess: (nextRoutes) => {
          setRoutes(nextRoutes);
          setSaveError("");
          const entry = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            createdAt: new Date().toISOString(),
            analysis,
            plan: {
              mode,
              durationMin,
              burnRatioPercent,
              targetBurnKcal
            },
            profile: {
              weightKg,
              paceMinPerKm,
              startLat,
              startLng
            },
            routes: nextRoutes
          };

          const saveKey = `${entry.createdAt}-${entry.analysis.foodName}-${entry.plan.mode}`;
          if (savedKeyRef.current === saveKey) return;
          savedKeyRef.current = saveKey;

          saveMutation.mutate(entry);
        }
      }
    );
  }, [
    analysis,
    burnRatioPercent,
    durationMin,
    mode,
    paceMinPerKm,
    routeMutation,
    saveMutation,
    routes.length,
    setRoutes,
    startLat,
    startLng,
    targetBurnKcal,
    weightKg
  ]);

  function onGetCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStart(position.coords.latitude, position.coords.longitude);
        setRoutes([]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  if (!analysis || !mode || !durationMin) return null;

  const selectedRoute = routes[selectedRouteIndex] || null;
  const center = selectedRoute?.start || { lat: startLat, lng: startLng };
  const path = selectedRoute?.path || [];

  return (
    <main className="app-shell md:px-8">
      <section className="glass-card">
        <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">3단계: 지도 확인</h1>
        <p className="mt-2 text-sm text-zinc-300">
          현재 위치와 추천 경로를 지도에서 확인하세요.
        </p>
      </section>

      <section className="glass-card space-y-4">
        <div className="glass-soft p-4 text-sm text-zinc-200">
          <p>목표 칼로리: {targetBurnKcal} kcal</p>
          <p>설정 비율: {burnRatioPercent}%</p>
          <p>선택한 방식: {getActivityLabel(mode)}</p>
          <p>
            권장 시간: <span className="font-bold text-emerald-300">{durationMin}분</span>
          </p>
        </div>
        {saveError && <p className="text-sm text-red-300">{saveError}</p>}

        {routeMutation.isPending && routes.length === 0 && (
          <p className="text-sm text-zinc-400">경로를 불러오는 중입니다...</p>
        )}
        {routeMutation.isError && routes.length === 0 && (
          <p className="text-sm text-red-300">{(routeMutation.error as Error).message}</p>
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
                    onClick={() => setSelectedRouteIndex(index)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs ${
                      selectedRouteIndex === index
                        ? "border-emerald-300 bg-emerald-300 text-zinc-900"
                        : "border-white/20 bg-zinc-900/60 text-zinc-200"
                    }`}
                  >
                    <p className="font-semibold">{route.name}</p>
                    <p>거리 {route.distanceKm}km</p>
                    <p>예상 {route.estimatedMinutes}분</p>
                    <p>
                      소모 {route.expectedBurnKcal}kcal ({burnPerKm.toFixed(1)} kcal/km)
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

        <div className="flex flex-wrap justify-center gap-2">
          <ActionButton
            href="/activity"
            variant="ghost"
            size="xs"
          >
            이전 화면
          </ActionButton>
          <ActionButton
            onClick={onGetCurrentLocation}
            variant="ghost"
            size="xs"
          >
            현재 위치 다시 가져오기
          </ActionButton>
          <ActionButton
            href="/history"
            variant="primary"
            size="xs"
            icon={<span>→</span>}
            iconPosition="right"
          >
            기록 화면으로
          </ActionButton>
        </div>
      </section>
    </main>
  );
}
