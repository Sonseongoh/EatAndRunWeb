import type { Metadata } from "next";

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@eatrun.app";

export const metadata: Metadata = {
  title: "문의하기 | Eat & Run",
  description: "Eat & Run 서비스 이용 중 문의 및 제휴 요청을 접수합니다."
};

export default function ContactPage() {
  return (
    <main className="app-shell">
      <section className="glass-card space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">문의하기</h1>
          <p className="text-sm leading-relaxed text-zinc-300">
            서비스 오류 제보, 광고/정책 문의, 제휴 요청은 아래 이메일로 보내주세요.
          </p>
        </header>

        <article className="glass-soft space-y-3 p-4">
          <h2 className="text-lg font-semibold text-white">고객지원 이메일</h2>
          <p className="text-sm text-zinc-300">
            <a
              href={`mailto:${supportEmail}`}
              className="underline decoration-zinc-500 underline-offset-4 hover:text-white"
            >
              {supportEmail}
            </a>
          </p>
          <p className="text-xs text-zinc-400">평일 기준 2영업일 이내 답변을 목표로 합니다.</p>
        </article>
      </section>
    </main>
  );
}
