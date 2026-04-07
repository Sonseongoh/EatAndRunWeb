"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/app/components/action-button";
import { useAuth } from "@/providers/auth-provider";

type OAuthProvider = "google" | "kakao";
type VisibleOAuthProvider = "google";

const OAUTH_LABELS: Record<OAuthProvider, string> = {
  google: "Google로 로그인",
  kakao: "Kakao로 로그인"
};

const VISIBLE_OAUTH_PROVIDERS: VisibleOAuthProvider[] = ["google"];

function isKakaoInAppBrowser() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  return /KAKAOTALK/i.test(ua);
}

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signInWithOtp, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [oauthPending, setOauthPending] = useState<OAuthProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isCopyDone, setIsCopyDone] = useState(false);
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/analyze");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    setIsInApp(isKakaoInAppBrowser());
  }, []);

  const inAppGuide = useMemo(
    () =>
      "카카오 인앱브라우저에서는 Google 로그인이 제한됩니다. 메뉴(⋮/⋯/공유)에서 외부 브라우저로 열어주세요.",
    []
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim();
    if (!normalized) {
      setErrorMessage("이메일을 입력해 주세요.");
      return;
    }

    setErrorMessage("");
    setIsPending(true);

    try {
      await signInWithOtp(normalized);
      setIsSent(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "로그인 메일 전송에 실패했습니다.";
      setErrorMessage(message);
    } finally {
      setIsPending(false);
    }
  }

  async function copyCurrentUrl() {
    if (typeof window === "undefined" || !window.navigator.clipboard) return;
    try {
      await window.navigator.clipboard.writeText(window.location.href);
      setIsCopyDone(true);
      setTimeout(() => setIsCopyDone(false), 2000);
    } catch {
      // no-op
    }
  }

  async function onOAuth(provider: OAuthProvider) {
    setErrorMessage("");

    if (provider === "google" && isInApp) {
      setErrorMessage(inAppGuide);
      return;
    }

    setOauthPending(provider);
    try {
      await signInWithOAuth(provider);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "소셜 로그인에 실패했습니다.";
      setErrorMessage(message);
      setOauthPending(null);
    }
  }

  return (
    <main className="app-shell md:px-8">
      <section className="glass-card mx-auto w-full max-w-xl">
        <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">로그인</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Google 또는 이메일 매직링크로 로그인할 수 있습니다.
        </p>

        {isInApp ? (
          <div className="mt-4 rounded-lg border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
            <p>{inAppGuide}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <ActionButton
                onClick={() => void copyCurrentUrl()}
                variant="ghost"
                size="sm"
                className="w-auto"
              >
                {isCopyDone ? "링크 복사됨" : "현재 링크 복사"}
              </ActionButton>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-2">
          {VISIBLE_OAUTH_PROVIDERS.map((provider) => (
            <ActionButton
              key={provider}
              onClick={() => void onOAuth(provider)}
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={Boolean(oauthPending)}
            >
              {oauthPending === provider ? "연결 중..." : OAUTH_LABELS[provider]}
            </ActionButton>
          ))}
        </div>

        <div className="my-5 h-px bg-white/10" />

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="glass-input w-full rounded-lg px-3 py-2 text-sm"
          />
          <ActionButton
            type="submit"
            variant="primary"
            size="sm"
            className="w-full"
            disabled={isPending || Boolean(oauthPending)}
          >
            {isPending ? "전송 중..." : "이메일 링크 보내기"}
          </ActionButton>
        </form>

        {isSent ? (
          <p className="mt-3 text-sm text-emerald-300">
            로그인 링크를 보냈습니다. 메일함에서 링크를 눌러주세요.
          </p>
        ) : null}
        {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
      </section>
    </main>
  );
}
