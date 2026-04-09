"use client";

import { ActionButton } from "@/app/components/action-button";

type Step3ActionsProps = {
  isSaving: boolean;
  t: (ko: string, en: string) => string;
  onGetCurrentLocation: () => void;
  onGoHistory: () => void;
};

export function Step3Actions({
  isSaving,
  t,
  onGetCurrentLocation,
  onGoHistory
}: Step3ActionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <ActionButton href="/activity" variant="ghost" size="xs">
        {t("이전 화면", "Back")}
      </ActionButton>
      <ActionButton onClick={onGetCurrentLocation} variant="ghost" size="xs">
        {t("현재 위치 다시 가져오기", "Use current location")}
      </ActionButton>
      <ActionButton
        onClick={onGoHistory}
        variant="primary"
        size="xs"
        disabled={isSaving}
        icon={<span>{">"}</span>}
        iconPosition="right"
      >
        {isSaving ? t("저장 중...", "Saving...") : t("기록 화면으로", "Go to history")}
      </ActionButton>
    </div>
  );
}
