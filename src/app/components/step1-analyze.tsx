"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalyzeMethod, AnalyzeMethodTabs } from "@/app/components/analyze-method-tabs";
import { PhotoAnalyzeForm } from "@/app/components/photo-analyze-form";
import { TextAnalyzeForm } from "@/app/components/text-analyze-form";
import { checkAuthAccess } from "@/lib/api";
import { useLocale } from "@/providers/locale-provider";

export function Step1Analyze() {
  const router = useRouter();
  const { t } = useLocale();
  const [method, setMethod] = useState<AnalyzeMethod>("photo");
  const [isAccessChecking, setIsAccessChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    void checkAuthAccess()
      .then((result) => {
        if (!mounted) return;
        if (!result.allowed) {
          router.replace("/login");
          return;
        }
        setIsAccessChecking(false);
      })
      .catch(() => {
        if (!mounted) return;
        router.replace("/login");
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  if (isAccessChecking) return null;

  return (
    <main className="app-shell md:px-8">
      <section className="glass-card">
        <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">
          {t("1단계: 음식 분석", "Step 1: Analyze meal")}
        </h1>
        <p className="mt-2 text-sm text-zinc-300">
          {t(
            "사진 업로드 또는 텍스트 입력으로 칼로리 분석을 시작할 수 있습니다.",
            "Start calorie analysis by uploading a photo or entering meal text."
          )}
        </p>
      </section>

      <section className="glass-card space-y-6">
        <AnalyzeMethodTabs method={method} onChange={setMethod} />
        {method === "photo" ? <PhotoAnalyzeForm /> : <TextAnalyzeForm />}
      </section>
    </main>
  );
}

