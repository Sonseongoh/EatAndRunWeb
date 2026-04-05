"use client";

export type AnalyzeMethod = "photo" | "text";

type AnalyzeMethodTabsProps = {
  method: AnalyzeMethod;
  onChange: (method: AnalyzeMethod) => void;
};

export function AnalyzeMethodTabs({ method, onChange }: AnalyzeMethodTabsProps) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-zinc-900/60 p-1">
      <button
        type="button"
        onClick={() => onChange("photo")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          method === "photo"
            ? "bg-emerald-400 text-zinc-950"
            : "text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
        }`}
      >
        사진 분석
      </button>
      <button
        type="button"
        onClick={() => onChange("text")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          method === "text"
            ? "bg-emerald-400 text-zinc-950"
            : "text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
        }`}
      >
        텍스트 입력
      </button>
    </div>
  );
}

