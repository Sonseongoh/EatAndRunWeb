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
  const albumInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  // 카메라 촬영(capture)은 모바일에서만 의미가 있어, 데스크톱에선 카메라 버튼을 숨긴다.
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const uaMobile = /iphone|ipad|ipod|android|mobile/i.test(navigator.userAgent);
    // 터치 우선 기기(폰·태블릿) 감지 — iPadOS가 데스크톱 UA로 위장해도 잡힌다.
    const coarsePointer =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    setIsMobile(uaMobile || coarsePointer);
  }, []);

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
      {/* 앨범/파일 선택 */}
      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        onChange={onSelectImage}
        className="hidden"
      />
      {/* 카메라 촬영 (모바일에서 후면 카메라 바로 열림; 데스크톱은 capture 무시). */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
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
          <div className="absolute right-5 top-5 flex items-center gap-1.5">
            {isMobile && (
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-1 rounded-full bg-zinc-100/95 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-white"
              >
                {t("카메라", "Camera")}
              </button>
            )}
            <button
              type="button"
              onClick={() => albumInputRef.current?.click()}
              className="flex items-center gap-1 rounded-full bg-zinc-100/95 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-white"
            >
              {isMobile ? t("앨범", "Album") : t("사진 변경", "Change photo")}
            </button>
          </div>
          <p className="absolute bottom-3 left-3 rounded-md bg-black/45 px-2 py-1 text-xs text-white">
            {selectedFile?.name}
          </p>
        </div>
      ) : (
        <div className="flex h-96 w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/25 text-sm text-zinc-400 md:h-[28rem]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-zinc-900 text-zinc-200">
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
          <div className="text-center">
            <p className="font-semibold text-zinc-100">{t("사진 선택하기", "Select photo")}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {t("음식을 촬영하거나 앨범에서 선택하세요", "Take a photo or pick from your album")}
            </p>
          </div>
          <div className="flex gap-2">
            {isMobile && (
              <ActionButton onClick={() => cameraInputRef.current?.click()} variant="ghost" size="sm">
                {t("카메라", "Camera")}
              </ActionButton>
            )}
            <ActionButton onClick={() => albumInputRef.current?.click()} variant="primary" size="sm">
              {isMobile ? t("앨범", "Album") : t("사진 선택", "Select photo")}
            </ActionButton>
          </div>
        </div>
      )}

      {/* 결과가 떠 있는 동안은 결과 카드의 다음 단계 CTA가 프라이머리 — 재분석은 보조로 물러난다.
          입력(사진)을 바꾸면 결과가 리셋되어 다시 프라이머리로 복귀. */}
      <ActionButton
        onClick={onAnalyze}
        disabled={!selectedFile || analyzeMutation.isPending}
        variant={analyzeMutation.data ? "ghost" : "primary"}
        size="sm"
        icon={
          analyzeMutation.isPending ? (
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : undefined
        }
        className="mx-auto mt-8 block disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:text-zinc-300"
      >
        {analyzeMutation.isPending
          ? t("분석 중...", "Analyzing...")
          : analyzeMutation.data
            ? t("다시 분석하기", "Re-analyze")
            : t("분석하기", "Analyze")}
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
