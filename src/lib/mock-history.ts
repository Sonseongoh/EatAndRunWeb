import { HistoryEntry } from "@/lib/types";

function toKstIsoString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}+09:00`;
}

export function createMockHistoryEntries(): HistoryEntry[] {
  const baseDate = new Date("2026-03-30T21:00:00+09:00");
  const entries: HistoryEntry[] = [];
  const totalDays = 24;

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset += 1) {
    const current = new Date(baseDate);
    current.setDate(baseDate.getDate() - dayOffset);

    const slots = [
      { hour: 7, minute: 18 },
      { hour: 12, minute: 34 },
      { hour: 20, minute: 46 }
    ];

    slots.forEach((slot, slotIndex) => {
      const created = new Date(current);
      created.setHours(slot.hour, slot.minute, (dayOffset + slotIndex) % 60, 0);
      const createdAt = toKstIsoString(created);
      const index = dayOffset * slots.length + slotIndex;
      const mode = (["walk", "brisk", "run"] as const)[index % 3];
      const kcalAvg = 1800 + ((index * 73) % 700);
      const burnRatioPercent = [25, 30, 35, 40, 45, 50, 60, 70][index % 8];
      const targetBurnKcal = Math.round((kcalAvg * burnRatioPercent) / 100);
      const durationMin = 60 + ((index * 19) % 190);
      const distance = Number((6 + ((index * 1.7) % 18)).toFixed(1));
      const foodName = ["피자", "치킨", "햄버거", "파스타", "덮밥", "샐러드"][index % 6];

      entries.push({
        id: `mock-${index + 1}`,
        createdAt,
        analysis: {
          foodName,
          kcalMin: Math.max(300, kcalAvg - 180),
          kcalMax: kcalAvg + 180,
          kcalAvg,
          confidence: 0.85,
          source: "mock"
        },
        plan: {
          mode,
          durationMin,
          burnRatioPercent,
          targetBurnKcal
        },
        profile: {
          weightKg: 62 + (index % 8),
          paceMinPerKm: Number((5.8 + (index % 6) * 0.3).toFixed(1)),
          startLat: 37.401,
          startLng: 126.922
        },
        routes: [
          {
            id: `mock-route-a-${index + 1}`,
            name: "코스 A",
            distanceKm: distance,
            estimatedMinutes: durationMin,
            expectedBurnKcal: targetBurnKcal,
            mapUrl: "https://maps.google.com",
            start: { lat: 37.401, lng: 126.922 },
            destination: { lat: 37.411, lng: 126.932 },
            path: [
              { lat: 37.401, lng: 126.922 },
              { lat: 37.406, lng: 126.927 },
              { lat: 37.411, lng: 126.932 }
            ],
            tags: ["테스트"]
          },
          {
            id: `mock-route-b-${index + 1}`,
            name: "코스 B",
            distanceKm: Number((distance * 0.72).toFixed(1)),
            estimatedMinutes: Math.max(20, Math.round(durationMin * 0.76)),
            expectedBurnKcal: Math.max(100, Math.round(targetBurnKcal * 0.78)),
            mapUrl: "https://maps.google.com",
            start: { lat: 37.401, lng: 126.922 },
            destination: { lat: 37.394, lng: 126.915 },
            path: [
              { lat: 37.401, lng: 126.922 },
              { lat: 37.398, lng: 126.919 },
              { lat: 37.394, lng: 126.915 }
            ],
            tags: ["테스트"]
          }
        ]
      });
    });
  }

  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
