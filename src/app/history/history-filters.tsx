"use client";

import { ActionButton } from "@/app/components/action-button";
import { getActivityLabel } from "@/lib/activity";
import { FilterMode } from "./history-view-types";

type HistoryFiltersProps = {
  keyword: string;
  modeFilter: FilterMode;
  startDate: string;
  endDate: string;
  locale: "ko" | "en";
  t: (ko: string, en: string) => string;
  onKeywordChange: (value: string) => void;
  onModeChange: (value: FilterMode) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onResetDates: () => void;
};

export function HistoryFilters({
  keyword,
  modeFilter,
  startDate,
  endDate,
  locale,
  t,
  onKeywordChange,
  onModeChange,
  onStartDateChange,
  onEndDateChange,
  onResetDates
}: HistoryFiltersProps) {
  return (
    <section className="glass-card">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {t("검색 및 필터", "Search & filters")}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="text"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={t("음식명 또는 코스명 검색", "Search meal or route name")}
          className="glass-input rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={modeFilter}
          onChange={(event) => onModeChange(event.target.value as FilterMode)}
          className="glass-input rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">{t("전체 방식", "All modes")}</option>
          <option value="walk">{getActivityLabel("walk", locale)}</option>
          <option value="brisk">{getActivityLabel("brisk", locale)}</option>
          <option value="run">{getActivityLabel("run", locale)}</option>
        </select>
      </div>

      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {t("기간", "Date range")}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="date"
          value={startDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="glass-input rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className="glass-input rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div className="mt-3 flex justify-end">
        <ActionButton onClick={onResetDates} variant="ghost" size="xs" className="py-1.5">
          {t("기간 초기화", "Reset dates")}
        </ActionButton>
      </div>
    </section>
  );
}
