"use client";

import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { useLocale } from "@/providers/locale-provider";

type LatLngPoint = { lat: number; lng: number };

type GoogleRouteMapProps = {
  center: LatLngPoint;
  path: LatLngPoint[];
  currentPosition?: LatLngPoint | null;
  trail?: LatLngPoint[];
};

const containerStyle = { width: "100%", height: "100%" };

export function GoogleRouteMap({ center, path, currentPosition, trail }: GoogleRouteMapProps) {
  const { t } = useLocale();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey
  });

  // 키 미설정/스크립트 로드 실패 모두 사용자 문구로. (설정 방법은 README — 화면에 env 변수명 노출 금지)
  if (!apiKey || loadError) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-400">
        {t(
          "지도를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
          "Failed to load the map. Please try again later."
        )}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
        {t("지도를 불러오는 중입니다...", "Loading map...")}
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      // gestureHandling "greedy": 모바일에서 한 손가락만으로 지도 이동/확대.
      // (기본 cooperative는 두 손가락을 요구해 불편)
      options={{ fullscreenControl: false, mapTypeControl: false, gestureHandling: "greedy" }}
    >
      <Marker position={center} />
      {currentPosition && (
        <Marker
          position={currentPosition}
          zIndex={1000}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#34d399",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2
          }}
        />
      )}
      {path.length > 1 && (
        <>
          <Polyline
            path={path}
            options={{
              strokeColor: "#0f172a",
              strokeOpacity: 0.85,
              strokeWeight: 9
            }}
          />
          <Polyline
            path={path}
            options={{
              strokeColor: "#38bdf8",
              strokeOpacity: 0.98,
              strokeWeight: 5
            }}
          />
        </>
      )}
      {/* 실제 지나온 궤적(주황) — 추천 경로(파랑) 위에 겹쳐 그려 이탈 여부를 눈으로 비교. */}
      {trail && trail.length > 1 && (
        <Polyline
          path={trail}
          options={{
            strokeColor: "#f59e0b",
            strokeOpacity: 0.95,
            strokeWeight: 5,
            zIndex: 500
          }}
        />
      )}
    </GoogleMap>
  );
}

