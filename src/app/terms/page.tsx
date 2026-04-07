import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | Eat & Run",
  description: "Eat & Run 서비스 이용 시 적용되는 기본 약관입니다."
};

export default function TermsPage() {
  return (
    <main className="app-shell">
      <section className="glass-card space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">이용약관</h1>
          <p className="text-sm text-zinc-400">최종 업데이트: 2026-04-07</p>
        </header>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. 서비스 목적</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            Eat & Run은 식사 기록과 운동 계획 수립을 지원하는 정보성 서비스를 제공합니다.
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. 이용자의 책임</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            이용자는 정확한 정보 입력과 안전한 계정 관리에 책임을 가지며, 관련 법령 및 서비스 정책을 준수해야
            합니다.
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. 금지 행위</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            자동화된 비정상 트래픽 생성, 타인의 계정 도용, 서비스 운영 방해, 불법 콘텐츠 게시 등은 금지됩니다.
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. 콘텐츠 및 책임 제한</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            본 서비스가 제공하는 칼로리 추정 및 운동 추천은 참고 정보이며, 개인의 건강 상태에 따라 전문가 상담이
            필요할 수 있습니다.
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">5. 약관 변경</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            약관 변경 시 서비스 내 공지 또는 관련 페이지를 통해 사전에 안내합니다.
          </p>
        </article>
      </section>
    </main>
  );
}
