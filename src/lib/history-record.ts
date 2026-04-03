import { HistoryEntry, RouteRecommendation } from "@/lib/types";

export type HistoryDbRow = {
  id: string;
  user_id: string;
  created_at: string;
  food_name: string;
  mode: "walk" | "brisk" | "run" | null;
  target_burn_kcal: number | null;
  burn_ratio_percent: number | null;
  duration_min: number | null;
  weight_kg: number;
  pace_min_per_km: number;
  start_lat: number;
  start_lng: number;
  route_names_text: string;
  analysis: HistoryEntry["analysis"];
  routes: HistoryEntry["routes"];
};

export function toHistoryDbRow(entry: HistoryEntry) {
  return {
    created_at: entry.createdAt,
    food_name: entry.analysis.foodName,
    mode: entry.plan?.mode ?? null,
    target_burn_kcal: entry.plan?.targetBurnKcal ?? null,
    burn_ratio_percent: entry.plan?.burnRatioPercent ?? null,
    duration_min: entry.plan?.durationMin ?? null,
    weight_kg: entry.profile.weightKg,
    pace_min_per_km: entry.profile.paceMinPerKm,
    start_lat: entry.profile.startLat,
    start_lng: entry.profile.startLng,
    route_names_text: entry.routes.map((route) => route.name).join(", "),
    analysis: entry.analysis,
    routes: entry.routes
  };
}

function normalizeRoutes(routes: unknown): RouteRecommendation[] {
  if (!Array.isArray(routes)) return [];
  return routes as RouteRecommendation[];
}

export function fromHistoryDbRow(row: HistoryDbRow): HistoryEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    analysis: row.analysis,
    plan: row.mode
      ? {
          mode: row.mode,
          durationMin: row.duration_min ?? 0,
          burnRatioPercent: row.burn_ratio_percent ?? 0,
          targetBurnKcal: row.target_burn_kcal ?? 0
        }
      : undefined,
    profile: {
      weightKg: row.weight_kg,
      paceMinPerKm: row.pace_min_per_km,
      startLat: row.start_lat,
      startLng: row.start_lng
    },
    routes: normalizeRoutes(row.routes)
  };
}
