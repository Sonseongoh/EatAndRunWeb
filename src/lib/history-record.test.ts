import { describe, expect, it } from "vitest";
import { HistoryEntry } from "@/lib/types";
import { fromHistoryDbRow, HistoryDbRow, toHistoryDbRow } from "@/lib/history-record";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "e1",
    createdAt: "2026-06-26T03:00:00+09:00",
    analysis: { foodName: "비빔밥", kcalMin: 500, kcalMax: 700, kcalAvg: 600, confidence: 0.9, source: "test" },
    plan: { mode: "walk", durationMin: 30, burnRatioPercent: 50, targetBurnKcal: 300 },
    profile: { weightKg: 70, paceMinPerKm: 7, startLat: 37.5, startLng: 127 },
    routes: [],
    ...overrides
  };
}

describe("completed_at 매핑", () => {
  it("미완료 entry는 completed_at이 null로 직렬화된다", () => {
    const row = toHistoryDbRow(makeEntry());
    expect(row.completed_at).toBeNull();
  });

  it("완료 entry는 completed_at으로 직렬화된다", () => {
    const row = toHistoryDbRow(makeEntry({ completion: { completedAt: "2026-06-26T05:00:00+09:00" } }));
    expect(row.completed_at).toBe("2026-06-26T05:00:00+09:00");
  });

  it("completed_at이 있으면 completion으로 역직렬화된다", () => {
    const row = { ...baseRow(), completed_at: "2026-06-26T05:00:00+09:00" };
    expect(fromHistoryDbRow(row).completion).toEqual({ completedAt: "2026-06-26T05:00:00+09:00" });
  });

  it("completed_at이 null이면 completion은 undefined다", () => {
    const row = { ...baseRow(), completed_at: null };
    expect(fromHistoryDbRow(row).completion).toBeUndefined();
  });

  it("완료 상태가 왕복(round-trip)에서 보존된다", () => {
    const entry = makeEntry({ completion: { completedAt: "2026-06-26T05:00:00+09:00" } });
    const row = { ...baseRow(), id: entry.id, completed_at: toHistoryDbRow(entry).completed_at };
    expect(fromHistoryDbRow(row).completion).toEqual(entry.completion);
  });
});

function baseRow(): HistoryDbRow {
  return {
    id: "e1",
    user_id: "u1",
    created_at: "2026-06-26T03:00:00+09:00",
    food_name: "비빔밥",
    mode: "walk",
    target_burn_kcal: 300,
    burn_ratio_percent: 50,
    duration_min: 30,
    weight_kg: 70,
    pace_min_per_km: 7,
    start_lat: 37.5,
    start_lng: 127,
    route_names_text: "",
    analysis: { foodName: "비빔밥", kcalMin: 500, kcalMax: 700, kcalAvg: 600, confidence: 0.9, source: "test" },
    routes: [],
    completed_at: null
  };
}
