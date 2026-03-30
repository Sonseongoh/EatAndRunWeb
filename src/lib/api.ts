import {
  HistoryEntry,
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

export type HistoryListRequest = {
  limit?: number;
  before?: string;
  mode?: "all" | "walk" | "brisk" | "run";
  startDate?: string;
  endDate?: string;
  keyword?: string;
};

export type HistoryListResponse = {
  entries: HistoryEntry[];
  nextCursor: string | null;
};

export async function fetchHistoryEntries(
  request: HistoryListRequest
): Promise<HistoryListResponse> {
  const searchParams = new URLSearchParams();
  if (request.limit) searchParams.set("limit", String(request.limit));
  if (request.before) searchParams.set("before", request.before);
  if (request.mode && request.mode !== "all") searchParams.set("mode", request.mode);
  if (request.startDate) searchParams.set("startDate", request.startDate);
  if (request.endDate) searchParams.set("endDate", request.endDate);
  if (request.keyword?.trim()) searchParams.set("q", request.keyword.trim());

  const response = await fetch(`/api/v1/history?${searchParams.toString()}`, {
    method: "GET"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "기록 조회에 실패했습니다.");
  }

  return response.json();
}

export async function saveHistoryEntry(entry: HistoryEntry): Promise<HistoryEntry> {
  const response = await fetch("/api/v1/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "기록 저장에 실패했습니다.");
  }

  const payload = await response.json();
  return payload.entry as HistoryEntry;
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const response = await fetch(`/api/v1/history?id=${encodeURIComponent(id)}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "기록 삭제에 실패했습니다.");
  }
}

export async function clearHistoryEntries(): Promise<void> {
  const response = await fetch("/api/v1/history?clear=true", {
    method: "DELETE"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "기록 초기화에 실패했습니다.");
  }
}

export async function seedMockHistoryEntries(): Promise<number> {
  const response = await fetch("/api/v1/history/seed", {
    method: "POST"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "테스트 데이터 입력에 실패했습니다.");
  }

  const payload = await response.json();
  return payload.inserted as number;
}
