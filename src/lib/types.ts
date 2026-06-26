export type FoodAnalysisResponse = {
  foodName: string;
  kcalMin: number;
  kcalMax: number;
  confidence: number;
  source: string;
};

export type RouteRecommendation = {
  id: string;
  name: string;
  distanceKm: number;
  estimatedMinutes: number;
  expectedBurnKcal: number;
  mapUrl: string;
  start: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  path: Array<{ lat: number; lng: number }>;
  tags: string[];
};

export type RouteRecommendRequest = {
  startLat: number;
  startLng: number;
  targetKcal: number;
  weightKg: number;
  paceMinPerKm: number;
  targetDurationMin?: number;
};

export type HistoryEntry = {
  id: string;
  createdAt: string;
  analysis: FoodAnalysisResponse & { kcalAvg: number };
  plan?: {
    mode: "walk" | "brisk" | "run";
    durationMin: number;
    burnRatioPercent: number;
    targetBurnKcal: number;
  };
  profile: {
    weightKg: number;
    paceMinPerKm: number;
    startLat: number;
    startLng: number;
  };
  routes: RouteRecommendation[];
  // 완수(Completion): 사용자가 이 계획의 운동을 실제로 했다고 표시한 사실.
  // 값이 있으면 완료, 없으면 미완료(놓침은 생성일과 현재 시각으로 파생).
  completion?: {
    completedAt: string; // ISO 8601
  };
};
