"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getActivityLabel } from "@/lib/activity";
import { useHistoryStore } from "@/store/use-history-store";

type FilterMode = "all" | "walk" | "brisk" | "run";

function formatDateGroup(isoDate: string) {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default function HistoryPage() {
  const { entries, removeEntry, clearEntries } = useHistoryStore();
  const [keyword, setKeyword] = useState("");
  const [modeFilter, setModeFilter] = useState<FilterMode>("all");

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return entries.filter((entry) => {
      const mode = entry.plan?.mode;
      const byMode = modeFilter === "all" ? true : mode === modeFilter;
      const byKeyword =
        q.length === 0 ||
        entry.analysis.foodName.toLowerCase().includes(q) ||
        entry.routes.some((route) => route.name.toLowerCase().includes(q));
      return byMode && byKeyword;
    });
  }, [entries, keyword, modeFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((entry) => {
      const key = formatDateGroup(entry.createdAt);
      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
      <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">운동 기록</h1>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
            >
              홈으로
            </Link>
            <button
              type="button"
              onClick={clearEntries}
              disabled={entries.length === 0}
              className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
            >
              전체 삭제
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          날짜별로 기록을 확인하고, 음식명/코스명 검색과 운동 방식 필터를 적용할 수 있습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="음식명 또는 코스명 검색"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as FilterMode)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">전체 방식</option>
            <option value="walk">걷기</option>
            <option value="brisk">빠른걸음</option>
            <option value="run">달리기</option>
          </select>
        </div>
      </section>

      {grouped.length === 0 ? (
        <section className="rounded-2xl border border-white/70 bg-white/80 p-8 text-sm text-slate-500 shadow-sm">
          조건에 맞는 기록이 없습니다.
        </section>
      ) : (
        grouped.map(([dateKey, items]) => (
          <section
            key={dateKey}
            className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">{dateKey}</h2>
            <div className="mt-4 space-y-3">
              {items.map((entry) => (
                <article key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {entry.analysis.foodName} | {entry.analysis.kcalAvg} kcal
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </p>
                      <p>
                        목표: {entry.plan?.targetBurnKcal ?? "-"} kcal ({entry.plan?.burnRatioPercent ?? "-"}%)
                      </p>
                      <p>
                        방식:{" "}
                        {entry.plan?.mode ? getActivityLabel(entry.plan.mode) : "미기록"} | 시간:{" "}
                        {entry.plan?.durationMin ?? "-"}분
                      </p>
                      <p>
                        프로필: {entry.profile.weightKg}kg, {entry.profile.paceMinPerKm}분/km
                      </p>
                      <p>경로: {entry.routes.map((route) => route.name).join(", ")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
