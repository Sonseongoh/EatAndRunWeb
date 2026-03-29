"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { analyzeFoodImage } from "@/lib/api";
import { calcAverageKcal } from "@/lib/running";
import { useFlowStore } from "@/store/use-flow-store";

export function Step1Analyze() {
  const router = useRouter();
  const { setAnalysis, resetFlow } = useFlowStore();
  const [preview, setPreview] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: analyzeFoodImage,
  });

  function onSelectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreview(objectUrl);
    setPreviewLoading(true);
    setPreviewError(false);
    analyzeMutation.reset();
    resetFlow();
  }

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onAnalyze() {
    if (!selectedFile) return;
    analyzeMutation.mutate(selectedFile, {
      onSuccess: (analysis) => {
        const kcalAvg = calcAverageKcal(analysis.kcalMin, analysis.kcalMax);
        setAnalysis({ ...analysis, kcalAvg });
      },
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10 md:px-8">
      <section className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          1단계: 음식 분석
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          음식 사진을 업로드하고 분석하기를 누르면 칼로리가 계산됩니다.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onSelectImage}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full overflow-hidden rounded-xl bg-slate-100 p-2">
            {previewLoading && !previewError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-sm text-slate-500">
                이미지 불러오는 중...
              </div>
            )}
            {previewError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-sm text-red-600">
                이미지 미리보기를 불러오지 못했습니다.
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="h-72 overflow-hidden rounded-lg md:h-80">
              <img
                src={preview}
                alt="선택한 음식"
                className="block h-full w-full object-cover bg-slate-100"
                loading="eager"
                decoding="sync"
                onLoad={() => setPreviewLoading(false)}
                onError={() => {
                  setPreviewLoading(false);
                  setPreviewError(true);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
            >
              사진 변경
            </button>
            <p className="absolute bottom-3 left-3 rounded-md bg-black/45 px-2 py-1 text-xs text-white">
              {selectedFile?.name}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex h-72 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 transition hover:border-mint-500 hover:bg-mint-50"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition group-hover:border-mint-500 group-hover:text-mint-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 5v14m-7-7h14"
                />
              </svg>
            </div>
            <p className="font-semibold text-slate-700">사진 선택하기</p>
            <p className="mt-1 text-xs text-slate-500">
              클릭해서 음식 사진을 업로드해주세요
            </p>
          </button>
        )}

        <button
          type="button"
          onClick={onAnalyze}
          disabled={!selectedFile || analyzeMutation.isPending}
          className="mx-auto block rounded-lg bg-mint-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {analyzeMutation.isPending ? "분석 중..." : "분석하기"}
        </button>

        {analyzeMutation.isError && (
          <p className="text-sm text-red-600">
            {(analyzeMutation.error as Error).message}
          </p>
        )}

        {analyzeMutation.data && (
          <div className="rounded-lg bg-mint-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">분석 결과</p>
            <p className="mt-2">음식: {analyzeMutation.data.foodName}</p>
            <p>
              칼로리: {analyzeMutation.data.kcalMin} -{" "}
              {analyzeMutation.data.kcalMax} kcal
            </p>
            <p>
              평균 칼로리:{" "}
              {calcAverageKcal(
                analyzeMutation.data.kcalMin,
                analyzeMutation.data.kcalMax,
              )}{" "}
              kcal
            </p>
            <button
              type="button"
              onClick={() => router.push("/activity")}
              className="mx-auto mt-3 block rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
            >
              다음 화면으로
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
