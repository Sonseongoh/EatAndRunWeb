"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/app/components/action-button";
import { useLocale } from "@/providers/locale-provider";

const DISMISS_KEY = "eat_run_pwa_install_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// 전역 설치 안내 배너. 브라우저 기본 설치는 발견성이 나빠 최소한의 커스텀 안내를 둔다(ADR-0006).
// 지원 브라우저는 beforeinstallprompt로 네이티브 설치, iOS는 수동 안내. 닫으면 기억, 설치됨이면 숨김.
export function InstallPrompt() {
  const { t } = useLocale();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => {
      setShow(false);
      localStorage.setItem(DISMISS_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS 사파리는 beforeinstallprompt 미지원 → 수동 설치 안내를 노출
    if (isIos()) {
      setShow(true);
      setIosHint(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setShow(false);
    setDeferred(null);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className="glass-card mx-auto flex max-w-xl items-center gap-3 border border-emerald-300/40 p-3">
        <span className="text-xl">📲</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">
            {t("앱으로 설치하기", "Install the app")}
          </p>
          <p className="text-xs text-zinc-400">
            {iosHint
              ? t(
                  "공유 버튼을 누르고 '홈 화면에 추가'를 선택하세요.",
                  "Tap Share, then 'Add to Home Screen'."
                )
              : t(
                  "홈 화면에 추가하면 매일 더 쉽게 돌아올 수 있어요.",
                  "Add to your home screen to come back more easily."
                )}
          </p>
        </div>
        {!iosHint && (
          <ActionButton onClick={install} variant="primary" size="xs" className="shrink-0">
            {t("설치", "Install")}
          </ActionButton>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("닫기", "Dismiss")}
          className="shrink-0 rounded-md px-2 py-1 text-zinc-400 hover:text-zinc-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
