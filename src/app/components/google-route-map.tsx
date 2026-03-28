"use client";

import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";

type LatLngPoint = { lat: number; lng: number };

type GoogleRouteMapProps = {
  center: LatLngPoint;
  path: LatLngPoint[];
};

const containerStyle = { width: "100%", height: "100%" };

export function GoogleRouteMap({ center, path }: GoogleRouteMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey
  });

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`를 설정하면 Google 지도 미리보기가 표시됩니다.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        지도를 불러오는 중...
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
      {path.length > 1 && (
        <Polyline
          path={path}
          options={{
            strokeColor: "#0f766e",
            strokeOpacity: 0.9,
            strokeWeight: 5
          }}
        />
      )}
    </GoogleMap>
  );
}
