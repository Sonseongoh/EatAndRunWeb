"use client";

import { CompletionRate } from "@/lib/completion";

type HistoryCompletionRateProps = {
  rate: CompletionRate;
  t: (ko: string, en: string) => string;
};

// 완수율 카드: 이미 결판난 계획(완수+놓침) 중 완수 비율. 오늘의 미완료는 분모에서 제외.
export function HistoryCompletionRate({ rate, t }: HistoryCompletionRateProps) {
  const percent = rate.rate === null ? null : Math.round(rate.rate * 100);

  return (
    <section className="glass-card">
      <h2 className="text-lg font-semibold text-zinc-100">{t("완수율", "Completion rate")}</h2>
      {percent === null ? (
        <p className="mt-3 text-sm text-zinc-400">
          {t(
            "아직 결판난 계획이 없어요. 오늘 계획을 완수해보세요.",
            "No decided plans yet. Complete today's plan to get started."
          )}
        </p>
      ) : (
        <div className="mt-3 flex items-end gap-3">
          <span className="text-4xl font-bold text-emerald-300">{percent}%</span>
          <span className="pb-1 text-sm text-zinc-400">
            {t("완수", "Done")} {rate.completed} · {t("놓침", "Missed")} {rate.missed}
            <span className="ml-1 text-zinc-500">
              ({t("결판난 계획", "decided")} {rate.decided})
            </span>
          </span>
        </div>
      )}
    </section>
  );
}
