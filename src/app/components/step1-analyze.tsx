"use client";

import Link from "next/link";
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
        <section className="glass-card text-center">
          <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">
            {t("1단계: 음식 분석", "Step 1: Analyze meal")}
          </h1>
          <p className="mx-auto mt-2 max-w-3xl break-keep text-sm text-zinc-300">
            {t(
              "이 단계에서는 사진 또는 텍스트로 식사를 입력하고, 예상 칼로리와 다음 러닝 계획의 기준값을 만듭니다.",
              "In this step, you enter a meal by photo or text to create the calorie baseline for the running plan."
            )}
          </p>
        </section>

        <section className="glass-card space-y-5">
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
              {t("분석 흐름 안내", "How the analysis works")}
            </p>
            <p className="mx-auto max-w-3xl text-sm leading-relaxed text-zinc-300">
              {t(
                "식사 입력, 칼로리 추정, 목표 소모량 계산, 경로 추천 순서로 이어집니다. 로그인 상태를 확인한 뒤 실제 분석 화면으로 자동 이동합니다.",
                "The flow goes from meal input to calorie estimate, burn target calculation, and route recommendation. After access is confirmed, the full analysis screen opens automatically."
              )}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <article className="glass-soft space-y-2 p-4">
              <p className="text-sm font-semibold text-white">{t("사진 분석", "Photo analysis")}</p>
              <p className="text-sm leading-relaxed text-zinc-300">
                {t(
                  "한 끼 사진을 업로드하면 음식 종류와 칼로리 범위를 빠르게 추정합니다.",
                  "Upload a meal photo to quickly estimate food type and calorie range."
                )}
              </p>
            </article>
            <article className="glass-soft space-y-2 p-4">
              <p className="text-sm font-semibold text-white">{t("텍스트 분석", "Text analysis")}</p>
              <p className="text-sm leading-relaxed text-zinc-300">
                {t(
                  "식사 이름과 양을 텍스트로 입력해도 운동 계획 생성에 필요한 값을 계산할 수 있습니다.",
                  "You can also enter the meal name and portion in text to calculate planning values."
                )}
              </p>
            </article>
            <article className="glass-soft space-y-2 p-4">
              <p className="text-sm font-semibold text-white">{t("러닝 연결", "Run planning")}</p>
              <p className="text-sm leading-relaxed text-zinc-300">
                {t(
                  "분석 결과는 바로 운동 강도와 지도 기반 추천 경로 계산으로 이어집니다.",
                  "The result flows directly into activity intensity and map-based route planning."
                )}
              </p>
            </article>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <ActionButton href="/login" variant="primary" size="sm">
              {t("로그인하고 시작하기", "Sign in to continue")}
            </ActionButton>
            <Link href="/faq" className="btn-ghost px-4 py-2 text-sm font-semibold">
              {t("자주 묻는 질문 보기", "Read the FAQ")}
            </Link>
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
                  "현재 입력한 내용과 분석 결과는 초기화됩니다. 계속하시겠습니까?",
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
