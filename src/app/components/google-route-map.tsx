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
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-400">
        `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`를 설정하면 Google 지도 미리보기를 사용할 수 있습니다.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
        지도를 불러오는 중입니다...
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
            strokeColor: "#34d399",
            strokeOpacity: 0.92,
            strokeWeight: 5
          }}
        />
      )}
    </GoogleMap>
  );
}
