import {
  FoodAnalysisResponse,
  RouteRecommendation,
  RouteRecommendRequest
} from "./types";

export async function analyzeFoodImage(
  file: File
): Promise<FoodAnalysisResponse> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("locale", "ko-KR");

  const response = await fetch("/api/v1/food/analyze", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error?.message ?? "칼로리 분석에 실패했습니다. 다시 시도해주세요.";
    throw new Error(message);
  }

  return response.json();
}

export async function recommendRunningRoutes(
  request: RouteRecommendRequest
): Promise<RouteRecommendation[]> {
  const response = await fetch("/api/v1/routes/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload?.error?.message ??
      "경로 추천에 실패했습니다. 위치를 확인한 뒤 다시 시도해주세요.";
    throw new Error(message);
  }

  const payload = await response.json();
  return payload.routes as RouteRecommendation[];
}
