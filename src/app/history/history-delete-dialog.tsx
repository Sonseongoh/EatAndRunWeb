"use client";

import { ActionButton } from "@/app/components/action-button";
import { ConfirmAction } from "./history-view-types";

type HistoryDeleteDialogProps = {
  confirmAction: ConfirmAction | null;
  isPending: boolean;
  t: (ko: string, en: string) => string;
  onClose: () => void;
  onConfirm: () => void;
};

export function HistoryDeleteDialog({
  confirmAction,
  isPending,
  t,
  onClose,
  onConfirm
}: HistoryDeleteDialogProps) {
  if (!confirmAction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-card w-full max-w-md space-y-4 border border-white/20">
        <h3 className="text-lg font-semibold text-zinc-100">{t("삭제 확인", "Confirm deletion")}</h3>
        <p className="text-sm text-zinc-300">
          {confirmAction.type === "clear-all"
            ? t(
                "모든 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.",
                "Delete all records? This cannot be undone."
              )
            : t(`해당 기록을 삭제할까요? (${confirmAction.label})`, `Delete this record? (${confirmAction.label})`)}
        </p>
        <div className="flex justify-end gap-2">
          <ActionButton onClick={onClose} variant="ghost" size="xs" disabled={isPending}>
            {t("취소", "Cancel")}
          </ActionButton>
          <ActionButton onClick={onConfirm} variant="danger" size="xs" disabled={isPending}>
            {isPending ? t("삭제 중...", "Deleting...") : t("삭제하기", "Delete")}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
