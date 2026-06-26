import { describe, expect, it } from "vitest";
import { HistoryEntry } from "@/lib/types";
import {
  computeCompletionRate,
  computeStreak,
  deriveCompletionState,
  selectPendingToday,
  toKstDateKey
} from "@/lib/completion";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "e1",
    createdAt: "2026-06-26T03:00:00+09:00",
    analysis: { foodName: "비빔밥", kcalMin: 500, kcalMax: 700, kcalAvg: 600, confidence: 0.9, source: "test" },
    profile: { weightKg: 70, paceMinPerKm: 7, startLat: 37.5, startLng: 127 },
    routes: [],
    ...overrides
  };
}

describe("toKstDateKey", () => {
  it("formats an instant as its KST calendar date", () => {
    // 2026-06-25T16:00Z = 2026-06-26T01:00 KST → KST 날짜는 26일
    expect(toKstDateKey("2026-06-25T16:00:00Z")).toBe("2026-06-26");
    // 2026-06-25T14:00Z = 2026-06-25T23:00 KST → 아직 25일
    expect(toKstDateKey("2026-06-25T14:00:00Z")).toBe("2026-06-25");
  });
});

describe("deriveCompletionState", () => {
  const now = new Date("2026-06-26T10:00:00+09:00");

  it("completed: 완료 시각이 있으면 날짜와 무관하게 completed", () => {
    const entry = makeEntry({
      createdAt: "2026-06-01T03:00:00+09:00",
      completion: { completedAt: "2026-06-01T05:00:00+09:00" }
    });
    expect(deriveCompletionState(entry, now)).toBe("completed");
  });

  it("pending: 오늘(KST) 생성 + 미완료면 pending", () => {
    const entry = makeEntry({ createdAt: "2026-06-26T08:00:00+09:00" });
    expect(deriveCompletionState(entry, now)).toBe("pending");
  });

  it("missed: 과거(KST) 생성 + 미완료면 missed", () => {
    const entry = makeEntry({ createdAt: "2026-06-25T22:00:00+09:00" });
    expect(deriveCompletionState(entry, now)).toBe("missed");
  });

  it("KST 자정 경계: 자정 직후 생성은 같은 날 pending", () => {
    const earlyNow = new Date("2026-06-26T01:00:00+09:00");
    const justAfterMidnight = makeEntry({ createdAt: "2026-06-26T00:10:00+09:00" });
    expect(deriveCompletionState(justAfterMidnight, earlyNow)).toBe("pending");
  });

  it("KST 자정 경계: 자정 직전(전날 23:50) 생성은 missed", () => {
    const earlyNow = new Date("2026-06-26T01:00:00+09:00");
    const justBeforeMidnight = makeEntry({ createdAt: "2026-06-25T23:50:00+09:00" });
    expect(deriveCompletionState(justBeforeMidnight, earlyNow)).toBe("missed");
  });
});

describe("selectPendingToday", () => {
  const now = new Date("2026-06-26T10:00:00+09:00");

  it("오늘 생성 + 미완료만 반환한다 (완료·과거·놓침 제외)", () => {
    const todayPending = makeEntry({ id: "today-pending", createdAt: "2026-06-26T08:00:00+09:00" });
    const todayDone = makeEntry({
      id: "today-done",
      createdAt: "2026-06-26T08:00:00+09:00",
      completion: { completedAt: "2026-06-26T09:00:00+09:00" }
    });
    const pastMissed = makeEntry({ id: "past-missed", createdAt: "2026-06-25T08:00:00+09:00" });

    const result = selectPendingToday([todayPending, todayDone, pastMissed], now);
    expect(result.map((e) => e.id)).toEqual(["today-pending"]);
  });

  it("해당하는 계획이 없으면 빈 배열", () => {
    const pastMissed = makeEntry({ createdAt: "2026-06-20T08:00:00+09:00" });
    expect(selectPendingToday([pastMissed], now)).toEqual([]);
    expect(selectPendingToday([], now)).toEqual([]);
  });
});

describe("computeCompletionRate", () => {
  const now = new Date("2026-06-26T10:00:00+09:00");

  it("완수 ÷ (완수 + 놓침), 오늘의 미완료는 분모에서 제외한다", () => {
    const entries = [
      makeEntry({ id: "c1", createdAt: "2026-06-24T08:00:00+09:00", completion: { completedAt: "2026-06-24T09:00:00+09:00" } }),
      makeEntry({ id: "c2", createdAt: "2026-06-23T08:00:00+09:00", completion: { completedAt: "2026-06-23T09:00:00+09:00" } }),
      makeEntry({ id: "c3", createdAt: "2026-06-22T08:00:00+09:00", completion: { completedAt: "2026-06-22T09:00:00+09:00" } }),
      makeEntry({ id: "m1", createdAt: "2026-06-21T08:00:00+09:00" }), // 놓침
      makeEntry({ id: "p1", createdAt: "2026-06-26T08:00:00+09:00" }), // 오늘 미완료 → 제외
      makeEntry({ id: "p2", createdAt: "2026-06-26T09:00:00+09:00" }) // 오늘 미완료 → 제외
    ];
    const result = computeCompletionRate(entries, now);
    expect(result).toEqual({ completed: 3, missed: 1, decided: 4, rate: 0.75 });
  });

  it("결판난 계획이 없으면(전부 오늘 미완료 또는 빈 입력) rate는 null", () => {
    expect(computeCompletionRate([], now).rate).toBeNull();
    const onlyPending = makeEntry({ createdAt: "2026-06-26T08:00:00+09:00" });
    expect(computeCompletionRate([onlyPending], now)).toEqual({
      completed: 0,
      missed: 0,
      decided: 0,
      rate: null
    });
  });

  it("전부 완수면 rate 1, 전부 놓침이면 rate 0", () => {
    const allDone = makeEntry({ createdAt: "2026-06-24T08:00:00+09:00", completion: { completedAt: "2026-06-24T09:00:00+09:00" } });
    expect(computeCompletionRate([allDone], now).rate).toBe(1);
    const allMissed = makeEntry({ createdAt: "2026-06-20T08:00:00+09:00" });
    expect(computeCompletionRate([allMissed], now).rate).toBe(0);
  });
});

describe("computeStreak", () => {
  const now = new Date("2026-06-26T10:00:00+09:00");

  // 특정 KST 날짜(YYYY-MM-DD)에 생성되고 선택적으로 완수된 entry
  function dayEntry(day: string, completed: boolean, id = day): HistoryEntry {
    return makeEntry({
      id,
      createdAt: `${day}T08:00:00+09:00`,
      completion: completed ? { completedAt: `${day}T09:00:00+09:00` } : undefined
    });
  }

  it("완수가 전혀 없으면 0", () => {
    expect(computeStreak([], now)).toBe(0);
    expect(computeStreak([dayEntry("2026-06-26", false)], now)).toBe(0);
  });

  it("오늘만 완수하면 1", () => {
    expect(computeStreak([dayEntry("2026-06-26", true)], now)).toBe(1);
  });

  it("오늘·어제·그제 연속 완수면 3", () => {
    const entries = [
      dayEntry("2026-06-26", true),
      dayEntry("2026-06-25", true),
      dayEntry("2026-06-24", true)
    ];
    expect(computeStreak(entries, now)).toBe(3);
  });

  it("중간에 완수 없는 날이 있으면 거기서 끊긴다", () => {
    // 오늘 완수, 어제(25) 없음 → 오늘까지만
    const entries = [dayEntry("2026-06-26", true), dayEntry("2026-06-24", true)];
    expect(computeStreak(entries, now)).toBe(1);
  });

  it("오늘은 아직 안 했어도 어제까지 연속이면 살아있다(끊김 아님)", () => {
    const entries = [dayEntry("2026-06-25", true), dayEntry("2026-06-24", true)];
    expect(computeStreak(entries, now)).toBe(2);
  });

  it("오늘·어제 모두 완수가 없으면 0", () => {
    expect(computeStreak([dayEntry("2026-06-24", true)], now)).toBe(0);
  });

  it("하루에 여러 계획 중 하나만 완수해도 그 날은 성공으로 센다", () => {
    const entries = [
      dayEntry("2026-06-26", false, "today-a"),
      dayEntry("2026-06-26", true, "today-b")
    ];
    expect(computeStreak(entries, now)).toBe(1);
  });
});
