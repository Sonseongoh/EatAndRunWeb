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
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey
  });

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-400">
        {t(
          "`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`를 설정하면 Google 지도 미리보기를 사용할 수 있습니다.",
          "Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable Google map preview."
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
      options={{ fullscreenControl: false, mapTypeControl: false }}
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

