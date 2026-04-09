import { HistoryEntry } from "@/lib/types";

export function formatDateGroup(isoDate: string) {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function groupEntriesByDate(entries: HistoryEntry[]) {
  const map = new Map<string, HistoryEntry[]>();
  entries.forEach((entry) => {
    const key = formatDateGroup(entry.createdAt);
    const list = map.get(key) || [];
    list.push(entry);
    map.set(key, list);
  });
  return Array.from(map.entries());
}

export function buildDailyBurnSeries(entries: HistoryEntry[]) {
  const actualTotals = new Map<string, number>();
  const targetTotals = new Map<string, number>();

  entries.forEach((entry) => {
    const key = formatDateGroup(entry.createdAt);
    const currentActual = actualTotals.get(key) ?? 0;
    const currentTarget = targetTotals.get(key) ?? 0;
    const burn = entry.routes.reduce((sum, route) => sum + (route.expectedBurnKcal ?? 0), 0);
    actualTotals.set(key, currentActual + burn);
    targetTotals.set(key, currentTarget + (entry.plan?.targetBurnKcal ?? 0));
  });

  const labels = Array.from(new Set([...actualTotals.keys(), ...targetTotals.keys()])).sort(
    (a, b) => a.localeCompare(b)
  );

  return labels.map((date) => ({
    date,
    actual: actualTotals.get(date) ?? 0,
    target: targetTotals.get(date) ?? 0
  }));
}

export function buildModeDistribution(entries: HistoryEntry[]) {
  const counts = { walk: 0, brisk: 0, run: 0 };
  entries.forEach((entry) => {
    const currentMode = entry.plan?.mode;
    if (!currentMode) return;
    counts[currentMode] += 1;
  });
  return counts;
}
