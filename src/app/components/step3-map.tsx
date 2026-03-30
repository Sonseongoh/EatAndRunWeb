"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10 md:px-8">
      <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">3단계: 지도 확인</h1>
        <p className="mt-2 text-sm text-slate-600">
          현재 위치와 추천 경로를 지도에서 확인하세요.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <div className="rounded-lg bg-mint-50 p-4 text-sm text-slate-700">
          <p>목표 칼로리: {targetBurnKcal} kcal</p>
          <p>설정 비율: {burnRatioPercent}%</p>
          <p>선택한 방식: {getActivityLabel(mode)}</p>
          <p>
            권장 시간: <span className="font-bold text-mint-700">{durationMin}분</span>
          </p>
        </div>
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        {routeMutation.isPending && routes.length === 0 && (
          <p className="text-sm text-slate-500">경로를 불러오는 중입니다...</p>
        )}
        {routeMutation.isError && routes.length === 0 && (
          <p className="text-sm text-red-600">{(routeMutation.error as Error).message}</p>
        )}

        {!routes.length ? (
          <div className="h-[420px] overflow-hidden rounded-xl border border-slate-300">
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
                        ? "border-mint-500 bg-mint-500 text-white"
                        : "border-slate-300 bg-white text-slate-700"
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

            <div className="h-[420px] overflow-hidden rounded-xl border border-slate-300">
              <DynamicGoogleRouteMap center={center} path={path} />
            </div>
          </>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/activity"
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
          >
            이전 화면
          </Link>
          <button
            type="button"
            onClick={onGetCurrentLocation}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
          >
            현재 위치 다시 가져오기
          </button>
          {selectedRoute?.mapUrl && (
            <a
              href={selectedRoute.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-mint-500 px-3 py-2 text-xs font-semibold text-white"
            >
              외부 지도 열기
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
