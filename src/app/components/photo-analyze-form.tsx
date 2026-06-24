"use client";

import { useMutation } from "@tanstack/react-query";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ActionButton } from "@/app/components/action-button";
import { FoodAnalysisResultCard } from "@/app/components/food-analysis-result-card";
import { analyzeFoodImage } from "@/lib/api";
import { calcAverageKcal } from "@/lib/running";
import { useLocale } from "@/providers/locale-provider";
import { useFlowStore } from "@/store/use-flow-store";

type PhotoAnalyzeFormProps = {
  onDirtyChange?: (dirty: boolean) => void;
};

const MAX_UPLOAD_EDGE = 1024;
const JPEG_QUALITY = 0.82;

// 업로드 전 이미지를 긴 변 기준 1024px JPEG로 축소해 전송 용량을 줄인다.
// (브라우저 → Vercel → Render → OpenAI 경로의 업로드/처리 시간을 단축)
async function downscaleImage(file: File): Promise<File> {
  if (typeof document === "undefined") return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode failed"));
      img.src = objectUrl;
    });

    const longest = Math.max(image.naturalWidth, image.naturalHeight);
    if (!longest || longest <= MAX_UPLOAD_EDGE) return file;

    const scale = MAX_UPLOAD_EDGE / longest;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function PhotoAnalyzeForm({ onDirtyChange }: PhotoAnalyzeFormProps) {
  const { t } = useLocale();
  const { setAnalysis, resetFlow } = useFlowStore();
  const [preview, setPreview] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: analyzeFoodImage
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

  useEffect(() => {
    onDirtyChange?.(Boolean(selectedFile || analyzeMutation.data));
  }, [analyzeMutation.data, onDirtyChange, selectedFile]);

  async function onAnalyze() {
    if (!selectedFile) return;
    const optimized = await downscaleImage(selectedFile);
    analyzeMutation.mutate(optimized, {
      onSuccess: (analysis) => {
        const kcalAvg = calcAverageKcal(analysis.kcalMin, analysis.kcalMax);
        setAnalysis({ ...analysis, kcalAvg });
      }
    });
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onSelectImage}
        className="hidden"
      />

      {preview ? (
        <div className="relative w-full overflow-hidden rounded-xl bg-zinc-900 p-2">
          {previewLoading && !previewError && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-sm text-zinc-400">
              {t("이미지 불러오는 중...", "Loading image...")}
            </div>
          )}
          {previewError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 text-sm text-red-300">
              {t("이미지 미리보기를 불러오지 못했습니다.", "Failed to load image preview.")}
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="h-96 overflow-hidden rounded-lg md:h-[28rem]">
            <img
              src={preview}
              alt={t("선택한 음식", "Selected meal")}
              className="block h-full w-full object-fill bg-zinc-900"
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
            className="absolute right-5 top-5 flex items-center gap-1 rounded-full bg-zinc-100/95 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-white"
          >
            {t("사진 변경", "Change photo")}
          </button>
          <p className="absolute bottom-3 left-3 rounded-md bg-black/45 px-2 py-1 text-xs text-white">
            {selectedFile?.name}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex h-96 w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/25 text-sm text-zinc-400 transition hover:border-emerald-300 hover:bg-emerald-300/10 md:h-[28rem]"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-zinc-900 text-zinc-200 transition group-hover:border-emerald-300 group-hover:text-emerald-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
            </svg>
          </div>
          <p className="font-semibold text-zinc-100">{t("사진 선택하기", "Select photo")}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {t("클릭해서 음식 사진을 업로드해주세요", "Click to upload your meal photo")}
          </p>
        </button>
      )}

      <ActionButton
        onClick={onAnalyze}
        disabled={!selectedFile || analyzeMutation.isPending}
        variant="primary"
        size="sm"
        icon={
          analyzeMutation.isPending ? (
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : undefined
        }
        className="mx-auto mt-8 block disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:text-zinc-300"
      >
        {analyzeMutation.isPending ? t("분석 중...", "Analyzing...") : t("분석하기", "Analyze")}
      </ActionButton>

      {analyzeMutation.isError && (
        <p className="mt-4 text-sm text-red-300">{(analyzeMutation.error as Error).message}</p>
      )}

      {analyzeMutation.data && (
        <div className="mt-6">
          <FoodAnalysisResultCard analysis={analyzeMutation.data} />
        </div>
      )}
    </>
  );
}
