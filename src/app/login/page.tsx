"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ActionButton } from "@/app/components/action-button";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signInWithOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/analyze");
    }
  }, [isAuthenticated, isLoading, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim();
    if (!normalized) {
      setErrorMessage("이메일을 입력해주세요.");
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

  return (
    <main className="app-shell md:px-8">
      <section className="glass-card mx-auto w-full max-w-xl">
        <h1 className="text-2xl font-bold text-zinc-100 md:text-3xl">로그인</h1>
        <p className="mt-2 text-sm text-zinc-300">
          첫 체험 이후에는 로그인이 필요합니다. 이메일 링크로 빠르게 로그인하세요.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
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
            disabled={isPending}
          >
            {isPending ? "전송 중..." : "로그인 링크 보내기"}
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

