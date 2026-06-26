import { HistoryEntry } from "@/lib/types";

// 한 계획(Plan)의 완수 상태. 놓침(missed)은 저장하지 않고 생성일·현재 시각으로 파생한다.
export type CompletionState = "pending" | "completed" | "missed";

const KST_TIME_ZONE = "Asia/Seoul";

// 시각을 KST 달력 날짜(YYYY-MM-DD)로 변환. KST는 DST가 없어 UTC+9 고정.
// 하루의 경계 판단(오늘/과거)은 반드시 이 키 비교로 통일한다.
export function toKstDateKey(instant: string | Date): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

// 완료 시각이 있으면 completed. 없으면 생성일이 오늘(KST)이면 pending, 과거면 missed.
export function deriveCompletionState(entry: HistoryEntry, now: Date): CompletionState {
  if (entry.completion?.completedAt) return "completed";
  const createdDay = toKstDateKey(entry.createdAt);
  const today = toKstDateKey(now);
  return createdDay >= today ? "pending" : "missed";
}

// 재방문 시 직면 대상: 오늘(KST) 생성 + 미완료인 계획. 완료·과거·놓침은 제외.
export function selectPendingToday(entries: HistoryEntry[], now: Date): HistoryEntry[] {
  return entries.filter((entry) => deriveCompletionState(entry, now) === "pending");
}

const DAY_MS = 24 * 60 * 60 * 1000;

// now에서 n일 전의 KST 날짜 키. KST는 DST가 없어 24시간 단위 감산이 안전하다.
function kstDayKeyMinus(now: Date, n: number): string {
  return toKstDateKey(new Date(now.getTime() - n * DAY_MS));
}

export type CompletionRate = {
  completed: number;
  missed: number;
  decided: number; // 결판난 계획 수 = 완수 + 놓침
  rate: number | null; // 완수율 0..1. 결판난 계획이 없으면 null.
};

// 완수율: 완수 ÷ (완수 + 놓침). 오늘의 미완료(pending)는 아직 결판나지 않아 분모에서 제외.
export function computeCompletionRate(entries: HistoryEntry[], now: Date): CompletionRate {
  let completed = 0;
  let missed = 0;
  for (const entry of entries) {
    const state = deriveCompletionState(entry, now);
    if (state === "completed") completed += 1;
    else if (state === "missed") missed += 1;
  }
  const decided = completed + missed;
  return { completed, missed, decided, rate: decided === 0 ? null : completed / decided };
}

// 연속 기록(Streak): "그날 생성된 계획을 하나라도 완수한 날"의 연속 일수.
// 오늘 완수했으면 오늘부터, 아직이면 어제부터(오늘 미완은 끊김이 아님) 거슬러 세고,
// 완수가 없는 날을 만나면 멈춘다.
export function computeStreak(entries: HistoryEntry[], now: Date): number {
  const successDays = new Set<string>();
  for (const entry of entries) {
    if (entry.completion?.completedAt) successDays.add(toKstDateKey(entry.createdAt));
  }
  if (successDays.size === 0) return 0;

  let offset: number;
  if (successDays.has(kstDayKeyMinus(now, 0))) offset = 0;
  else if (successDays.has(kstDayKeyMinus(now, 1))) offset = 1;
  else return 0;

  let streak = 0;
  while (successDays.has(kstDayKeyMinus(now, offset))) {
    streak += 1;
    offset += 1;
  }
  return streak;
}
