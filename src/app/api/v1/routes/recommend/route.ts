import { NextRequest, NextResponse } from "next/server";
import { calcBurnPerKm } from "@/lib/running";

type RequestBody = {
  startLat: number;
  startLng: number;
  targetKcal: number;
  weightKg: number;
  paceMinPerKm: number;
};

type Point = { lat: number; lng: number };

type RouteResult = {
  distanceKm: number;
  durationMin: number;
  path: Point[];
};

const googleApiKey =
  process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function destinationPoint(start: Point, distanceKm: number, bearingDeg: number) {
  const R = 6371;
  const bearing = (bearingDeg * Math.PI) / 180;
  const lat1 = (start.lat * Math.PI) / 180;
  const lon1 = (start.lng * Math.PI) / 180;
  const dByR = distanceKm / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dByR) +
      Math.cos(lat1) * Math.sin(dByR) * Math.cos(bearing)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(dByR) * Math.cos(lat1),
      Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat2)
    );

  return { lat: (lat2 * 180) / Math.PI, lng: (lon2 * 180) / Math.PI };
}

function decodePolyline(encoded: string) {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const points: Point[] = [];

  while (index < encoded.length) {
    let b = 0;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

async function getGoogleWalkingRoute(start: Point, destination: Point): Promise<RouteResult> {
  if (!googleApiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set.");
  }

  const params = new URLSearchParams({
    origin: `${start.lat},${start.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: "walking",
    alternatives: "false",
    key: googleApiKey
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Google Directions 요청에 실패했습니다.");
  }

  const data = await response.json();
  if (data?.status !== "OK" || !data?.routes?.length) {
    throw new Error(data?.error_message || "Google Directions 경로를 찾을 수 없습니다.");
  }

  const route = data.routes[0];
  const leg = route.legs?.[0];
  if (!leg?.distance?.value || !leg?.duration?.value || !route?.overview_polyline?.points) {
    throw new Error("Google Directions 응답 형식이 올바르지 않습니다.");
  }

  return {
    distanceKm: Number((leg.distance.value / 1000).toFixed(1)),
    durationMin: Math.max(1, Math.round(leg.duration.value / 60)),
    path: decodePolyline(route.overview_polyline.points)
  };
}

async function getOsrmWalkingRoute(start: Point, destination: Point): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("OSRM 경로 제공자 요청에 실패했습니다.");

  const data = await response.json();
  const route = data?.routes?.[0];
  if (!route?.geometry?.coordinates || !route.distance || !route.duration) {
    throw new Error("OSRM 응답에 경로 데이터가 없습니다.");
  }

  return {
    distanceKm: Number((route.distance / 1000).toFixed(1)),
    durationMin: Math.max(1, Math.round(route.duration / 60)),
    path: (route.geometry.coordinates as [number, number][]).map((coord) => ({
      lng: coord[0],
      lat: coord[1]
    }))
  };
}

async function getRouteWithProvider(start: Point, destination: Point) {
  if (googleApiKey) {
    try {
      const route = await getGoogleWalkingRoute(start, destination);
      return { route, provider: "google-directions" as const };
    } catch {
      const route = await getOsrmWalkingRoute(start, destination);
      return { route, provider: "osrm-fallback" as const };
    }
  }

  const route = await getOsrmWalkingRoute(start, destination);
  return { route, provider: "osrm" as const };
}

async function fetchElevation(path: Point[]) {
  if (path.length < 2) return null;
  const sampled = path.filter((_, idx) => idx % 4 === 0).slice(0, 90);
  if (sampled.length < 2) return null;

  const locations = sampled.map((point) => `${point.lat},${point.lng}`).join("|");
  const response = await fetch(
    `https://api.open-elevation.com/api/v1/lookup?locations=${encodeURIComponent(locations)}`,
    { cache: "no-store" }
  );
  if (!response.ok) return null;

  const payload = await response.json().catch(() => null);
  const results = payload?.results;
  if (!Array.isArray(results) || results.length < 2) return null;

  const elevations = results
    .map((item: { elevation?: number }) => Number(item?.elevation))
    .filter((v: number) => Number.isFinite(v));

  if (elevations.length < 2) return null;

  let ascent = 0;
  for (let i = 1; i < elevations.length; i += 1) {
    const delta = elevations[i] - elevations[i - 1];
    if (delta > 0) ascent += delta;
  }
  return ascent;
}

function validateBody(body: RequestBody) {
  const valid =
    Number.isFinite(body.startLat) &&
    Number.isFinite(body.startLng) &&
    Number.isFinite(body.targetKcal) &&
    Number.isFinite(body.weightKg) &&
    Number.isFinite(body.paceMinPerKm) &&
    Math.abs(body.startLat) <= 90 &&
    Math.abs(body.startLng) <= 180 &&
    body.targetKcal > 0 &&
    body.weightKg >= 35 &&
    body.weightKg <= 180 &&
    body.paceMinPerKm >= 3 &&
    body.paceMinPerKm <= 15;

  if (!valid) throw new Error("경로 추천 입력값이 올바르지 않습니다.");
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody;

  try {
    validateBody(body);
  } catch (error) {
    return NextResponse.json(
      {
        error: { code: "INVALID_REQUEST", message: (error as Error).message }
      },
      { status: 400 }
    );
  }

  const start = { lat: body.startLat, lng: body.startLng };
  const burnPerKm = calcBurnPerKm(body.weightKg);
  const targetDistanceKm = Math.max(1, body.targetKcal / burnPerKm);

  const templates = [
    { id: "course-a", name: "코스 A", ratio: 0.85, bearings: [35], tags: ["짧은 거리", "완만"] },
    { id: "course-b", name: "코스 B", ratio: 1, bearings: [120], tags: ["기본 거리", "균형"] },
    { id: "course-c", name: "코스 C", ratio: 1.15, bearings: [260, 300, 340], tags: ["긴 거리", "오르막 우선"] }
  ];

  let provider = googleApiKey ? "google-directions" : "osrm";

  try {
    const routes = await Promise.all(
      templates.map(async (template) => {
        const targetKm = Number((targetDistanceKm * template.ratio).toFixed(1));
        const oneWayKm = Math.max(0.6, targetKm / 2);

        const candidates = await Promise.all(
          template.bearings.map(async (bearing) => {
            const destination = destinationPoint(start, oneWayKm, bearing);
            const { route, provider: pickedProvider } = await getRouteWithProvider(
              start,
              destination
            );
            if (pickedProvider === "osrm-fallback") provider = "osrm-fallback";
            if (pickedProvider === "google-directions") provider = "google-directions";
            if (pickedProvider === "osrm" && provider !== "google-directions") provider = "osrm";

            const ascent = template.id === "course-c" ? await fetchElevation(route.path) : null;
            return { destination, route, ascent: ascent ?? -1 };
          })
        );

        const best =
          template.id === "course-c"
            ? candidates.reduce((acc, curr) => (curr.ascent > acc.ascent ? curr : acc))
            : candidates[0];

        const expectedBurnKcal = Math.round(best.route.distanceKm * burnPerKm);
        const estimatedMinutes = Math.max(
          1,
          Math.round(best.route.distanceKm * body.paceMinPerKm)
        );
        const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lng}&destination=${best.destination.lat},${best.destination.lng}&travelmode=walking`;

        return {
          id: template.id,
          name: template.name,
          distanceKm: best.route.distanceKm,
          estimatedMinutes,
          expectedBurnKcal,
          mapUrl,
          start,
          destination: best.destination,
          path: best.route.path,
          tags: template.tags
        };
      })
    );

    return NextResponse.json(
      { routes, provider, generatedAt: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "ROUTE_PROVIDER_FAILED",
          message:
            (error as Error).message || "경로 제공자로부터 경로 생성에 실패했습니다."
        }
      },
      { status: 502 }
    );
  }
}
