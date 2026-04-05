"use client";

import { useState } from "react";
import { AnalyzeMethod, AnalyzeMethodTabs } from "@/app/components/analyze-method-tabs";
import { PhotoAnalyzeForm } from "@/app/components/photo-analyze-form";
import { TextAnalyzeForm } from "@/app/components/text-analyze-form";

export function Step1Analyze() {
  const [method, setMethod] = useState<AnalyzeMethod>("photo");

  return (
    <main className="app-shell md:px-8">
      <section className="glass-card">
        <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">1단계: 음식 분석</h1>
        <p className="mt-2 text-sm text-zinc-300">
          사진 업로드 또는 텍스트 입력으로 칼로리 분석을 시작할 수 있습니다.
        </p>
      </section>

      <section className="glass-card space-y-6">
        <AnalyzeMethodTabs method={method} onChange={setMethod} />
        {method === "photo" ? <PhotoAnalyzeForm /> : <TextAnalyzeForm />}
      </section>
    </main>
  );
}
