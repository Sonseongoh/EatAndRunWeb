"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/app/components/action-button";
import { recommendRunningRoutes, saveHistoryEntry } from "@/lib/api";
import { calcAverageKcal } from "@/lib/running";
import { useRouteFollow } from "@/lib/use-route-follow";
import { useLocale } from "@/providers/locale-provider";
import { useFlowStore } from "@/store/use-flow-store";
import { useRunProfileStore } from "@/store/use-run-profile-store";
import { Step3Actions } from "./step3-actions";
import { Step3RoutePanel } from "./step3-route-panel";
import { Step3Summary } from "./step3-summary";

export function Step3Map() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, locale } = useLocale();
  const { analysis, mode, durationMin, routes, selectedRouteIndex, setSelectedRouteIndex, setRoutes } =
    useFlowStore();
  const { setStart, burnRatioPercent, startLat, startLng, weightKg, paceMinPerKm } =
    useRunProfileStore();
  const [saveError, setSaveError] = useState("");
  const [locationError, setLocationError] = useState("");
  const savedKeyRef = useRef<string>("");
  const routeRequestKeyRef = useRef<string>("");

  const {
    isTracking,
    currentPosition,
    traveledKm,
    errorCode: followErrorCode,
    start: startFollow,
    stop: stopFollow
  } = useRouteFollow();

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
        error instanceof Error ? error.message : t("기록 저장에 실패했습니다. 다시 시도해주세요.", "Failed to save history. Please try again.")
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

    const requestKey = [
      analysis.foodName,
      mode,
      durationMin,
      burnRatioPercent,
      weightKg,
      paceMinPerKm,
      startLat,
      startLng
    ].join("|");

    if (routeRequestKeyRef.current === requestKey) return;
    routeRequestKeyRef.current = requestKey;

    routeMutation.mutate(
      {
        startLat,
        startLng,
        targetKcal: Math.max(
          1,
          Math.round((calcAverageKcal(analysis.kcalMin, analysis.kcalMax) * burnRatioPercent) / 100)
        ),
        weightKg,
        paceMinPerKm,
        targetDurationMin: durationMin
      },
      {
        onSuccess: (nextRoutes) => {
          setRoutes(nextRoutes);
          setSaveError("");
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
    routes.length,
    setRoutes,
    startLat,
    startLng,
    weightKg
  ]);

  useEffect(() => {
    if (!routeMutation.isError) return;
    const message = routeMutation.error instanceof Error ? routeMutation.error.message : "";
    const normalized = message.toLowerCase();
    if (normalized.includes("login") || message.includes("로그인")) {
      router.replace("/login");
    }
  }, [routeMutation.error, routeMutation.isError, router]);

  function onGetCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError(
        t(
          "이 브라우저에서는 위치 기능을 사용할 수 없습니다.",
          "Location is not available in this browser."
        )
      );
      return;
    }
    setLocationError("");
    routeMutation.reset();
    routeRequestKeyRef.current = "";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationError("");
        setStart(position.coords.latitude, position.coords.longitude);
        setRoutes([]);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            t(
              "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해주세요.",
              "Location permission was denied. Please allow location access in your browser settings."
            )
          );
        } else if (error.code === error.TIMEOUT) {
          setLocationError(
            t(
              "위치를 가져오는 데 시간이 너무 오래 걸립니다. 다시 시도해주세요.",
              "Getting your location timed out. Please try again."
            )
          );
        } else {
          setLocationError(
            t(
              "현재 위치를 가져오지 못했습니다. 다시 시도해주세요.",
              "Failed to get your current location. Please try again."
            )
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function onRetryRouteRecommend() {
    routeMutation.reset();
    routeRequestKeyRef.current = "";
    setRoutes([]);
  }

  async function onGoHistory() {
    if (!analysis || !mode || !durationMin) {
      router.push("/history");
      return;
    }

    const selectedRoute = routes[selectedRouteIndex] || null;
    if (!selectedRoute) {
      router.push("/history");
      return;
    }

    const saveKey = [
      analysis.foodName,
      analysis.kcalMin,
      analysis.kcalMax,
      mode,
      durationMin,
      burnRatioPercent,
      targetBurnKcal,
      weightKg,
      paceMinPerKm,
      selectedRoute.id
    ].join("|");

    if (savedKeyRef.current !== saveKey) {
      savedKeyRef.current = saveKey;
      setSaveError("");
      try {
        await saveMutation.mutateAsync({
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
          routes: [selectedRoute]
        });
      } catch {
        return;
      }
    }

    router.push("/history");
  }

  if (!analysis || !mode || !durationMin) return null;

  const selectedRoute = routes[selectedRouteIndex] || null;
  const center = selectedRoute?.start || { lat: startLat, lng: startLng };
  const path = selectedRoute?.path || [];

  const followErrorMessage =
    followErrorCode === "unsupported"
      ? t("이 브라우저에서는 위치 기능을 사용할 수 없습니다.", "Location is not available in this browser.")
      : followErrorCode === "denied"
        ? t(
            "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해주세요.",
            "Location permission was denied. Please allow location access in your browser settings."
          )
        : followErrorCode === "failed"
          ? t("현재 위치를 추적하지 못했습니다. 다시 시도해주세요.", "Failed to track your location. Please try again.")
          : "";

  return (
    <main className="app-shell md:px-8">
      <section className="glass-card text-center">
        <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">
          {t("3단계: 지도 확인", "Step 3: Map review")}
        </h1>
        <p className="mx-auto mt-2 max-w-3xl break-keep text-sm text-zinc-300">
          {t("현재 위치와 추천 경로를 지도에서 확인하세요.", "Check your current position and recommended routes on the map.")}
        </p>
      </section>

      <section className="glass-card space-y-4">
        <Step3Summary
          targetBurnKcal={targetBurnKcal}
          burnRatioPercent={burnRatioPercent}
          mode={mode}
          durationMin={durationMin}
          locale={locale}
          t={t}
        />

        {saveError && <p className="text-sm text-red-300">{saveError}</p>}

        <Step3RoutePanel
          routes={routes}
          selectedRouteIndex={selectedRouteIndex}
          center={center}
          path={path}
          currentPosition={currentPosition}
          isPending={routeMutation.isPending}
          isError={routeMutation.isError}
          errorMessage={(routeMutation.error as Error)?.message ?? ""}
          t={t}
          onRetry={onRetryRouteRecommend}
          onSelectRoute={setSelectedRouteIndex}
        />

        {selectedRoute && (
          <div className="glass-soft flex flex-wrap items-center justify-between gap-3 p-3">
            <p className="text-sm text-zinc-200">
              {isTracking ? (
                <>
                  <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400 align-middle" />
                  {t("따라가는 중", "Following")} · {t("이동", "Distance")} {traveledKm.toFixed(2)}km
                </>
              ) : (
                t(
                  "경로를 따라가며 실시간 위치를 지도에서 확인하세요.",
                  "Follow the route and see your live position on the map."
                )
              )}
            </p>
            {isTracking ? (
              <ActionButton onClick={stopFollow} variant="danger" size="xs">
                {t("따라가기 중지", "Stop")}
              </ActionButton>
            ) : (
              <ActionButton onClick={startFollow} variant="primary" size="xs">
                {t("따라가기 시작", "Start following")}
              </ActionButton>
            )}
          </div>
        )}

        {followErrorMessage && (
          <p className="text-sm text-red-300" role="alert">
            {followErrorMessage}
          </p>
        )}

        {locationError && (
          <p className="text-sm text-red-300" role="alert">
            {locationError}
          </p>
        )}

        <Step3Actions
          isSaving={saveMutation.isPending}
          isRecommending={routeMutation.isPending}
          t={t}
          onGetCurrentLocation={onGetCurrentLocation}
          onRetryRoutes={onRetryRouteRecommend}
          onGoHistory={() => void onGoHistory()}
        />
      </section>
    </main>
  );
}
