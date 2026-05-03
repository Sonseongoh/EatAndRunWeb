"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionButton } from "@/app/components/action-button";
import { AnalyzeMethod, AnalyzeMethodTabs } from "@/app/components/analyze-method-tabs";
import { PhotoAnalyzeForm } from "@/app/components/photo-analyze-form";
import { TextAnalyzeForm } from "@/app/components/text-analyze-form";
import { checkAuthAccess } from "@/lib/api";
import { useLocale } from "@/providers/locale-provider";
import { useFlowStore } from "@/store/use-flow-store";

export function Step1Analyze() {
  const router = useRouter();
  const { t } = useLocale();
  const resetFlow = useFlowStore((state) => state.resetFlow);
  const [method, setMethod] = useState<AnalyzeMethod>("photo");
  const [isAccessChecking, setIsAccessChecking] = useState(true);
  const [photoDirty, setPhotoDirty] = useState(false);
  const [textDirty, setTextDirty] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<AnalyzeMethod | null>(null);

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

  function onRequestMethodChange(nextMethod: AnalyzeMethod) {
    if (nextMethod === method) return;

    const currentDirty = method === "photo" ? photoDirty : textDirty;
    if (!currentDirty) {
      setMethod(nextMethod);
      return;
    }

    setPendingMethod(nextMethod);
  }

  function onConfirmMethodChange() {
    if (!pendingMethod) return;
    resetFlow();
    setPhotoDirty(false);
    setTextDirty(false);
    setMethod(pendingMethod);
    setPendingMethod(null);
  }

  if (isAccessChecking) {
    return (
      <main className="app-shell md:px-8">
        <section className="glass-card flex min-h-[320px] flex-col items-center justify-center gap-5 text-center">
          <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-emerald-200/30 border-t-emerald-300" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">
              {t("1단계: 음식 분석", "Step 1: Analyze meal")}
            </h1>
            <p className="text-sm text-zinc-300">{t("불러오는 중입니다...", "Loading...")}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell md:px-8">
      <section className="glass-card text-center">
        <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">
          {t("1단계: 음식 분석", "Step 1: Analyze meal")}
        </h1>
        <p className="mx-auto mt-2 max-w-3xl break-keep text-sm text-zinc-300">
          {t(
            "사진 업로드 또는 텍스트 입력으로 칼로리 분석을 시작할 수 있습니다.",
            "Start calorie analysis by uploading a photo or entering meal text."
          )}
        </p>
      </section>

      <section className="glass-card space-y-6">
        <div className="flex justify-center">
          <AnalyzeMethodTabs method={method} onChange={onRequestMethodChange} />
        </div>
        {method === "photo" ? (
          <PhotoAnalyzeForm onDirtyChange={setPhotoDirty} />
        ) : (
          <TextAnalyzeForm onDirtyChange={setTextDirty} />
        )}
      </section>

      {pendingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
          <div className="glass-card w-full max-w-md space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-zinc-100">
                {t("분석 방식을 전환할까요?", "Switch analysis method?")}
              </h2>
              <p className="text-sm leading-relaxed text-zinc-300">
                {t(
                  "현재 입력 내용과 분석 결과가 초기화됩니다. 계속하시겠습니까?",
                  "Your current input and analysis result will be cleared. Do you want to continue?"
                )}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <ActionButton onClick={() => setPendingMethod(null)} variant="ghost" size="xs">
                {t("취소", "Cancel")}
              </ActionButton>
              <ActionButton onClick={onConfirmMethodChange} variant="danger" size="xs">
                {t("초기화 후 전환", "Clear and switch")}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
