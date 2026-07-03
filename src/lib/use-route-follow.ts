"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type LatLng = { lat: number; lng: number };

// 경로 따라가기 오류 코드(표시 문구는 컴포넌트에서 로케일 처리).
export type RouteFollowError = "" | "unsupported" | "denied" | "failed";

// 두 좌표 사이 거리(km). GPS 이동 누적에 사용.
function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

type WakeLockSentinelLike = { release: () => Promise<void> };

// 포그라운드 실시간 위치 추적(경로 따라가기 v1).
// watchPosition으로 현재 위치를 갱신하고 이동 거리를 누적한다. 화면 유지를 위해 Wake Lock을
// 시도하되, 미지원(iOS 사파리 등)이면 조용히 무시하고 추적만 이어간다. 백그라운드(화면 끔)에선
// 브라우저가 갱신을 멈추는 게 웹의 한계 — 포그라운드 전용이다.
export function useRouteFollow() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
  // 지나온 궤적(자취). 유의미하게 움직일 때마다 좌표를 누적해 지도에 실제 이동 경로를 그린다.
  const [trail, setTrail] = useState<LatLng[]>([]);
  const [traveledKm, setTraveledKm] = useState(0);
  const [errorCode, setErrorCode] = useState<RouteFollowError>("");

  const watchIdRef = useRef<number | null>(null);
  const lastPosRef = useRef<LatLng | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  const acquireWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
      };
      if (nav.wakeLock) {
        wakeLockRef.current = await nav.wakeLock.request("screen");
      }
    } catch {
      // wake lock 미지원/실패는 무시(추적은 계속).
    }
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    lastPosRef.current = null;
    releaseWakeLock();
    setIsTracking(false);
  }, [releaseWakeLock]);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorCode("unsupported");
      return;
    }
    setErrorCode("");
    setTraveledKm(0);
    setTrail([]);
    setCurrentPosition(null);
    lastPosRef.current = null;
    setIsTracking(true);
    void acquireWakeLock();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentPosition(next);
        const last = lastPosRef.current;
        if (last) {
          const moved = haversineKm(last, next);
          // GPS 노이즈로 인한 미세 이동(<8m)은 누적하지 않는다.
          if (moved >= 0.008) {
            setTraveledKm((km) => km + moved);
            setTrail((prev) => [...prev, next]);
            lastPosRef.current = next;
          }
        } else {
          // 첫 위치 확정: 궤적의 시작점으로 기록.
          lastPosRef.current = next;
          setTrail([next]);
        }
      },
      (geoError) => {
        setErrorCode(geoError.code === geoError.PERMISSION_DENIED ? "denied" : "failed");
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
  }, [acquireWakeLock]);

  // 백그라운드 전환 시 wake lock이 자동 해제되므로, 다시 보이면 재획득.
  useEffect(() => {
    function onVisibilityChange() {
      if (isTracking && document.visibilityState === "visible" && !wakeLockRef.current) {
        void acquireWakeLock();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [isTracking, acquireWakeLock]);

  // 언마운트 시 정리.
  useEffect(() => stop, [stop]);

  return { isTracking, currentPosition, trail, traveledKm, errorCode, start, stop };
}
