import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "서비스 소개 | Eat & Run",
  description:
    "Eat & Run은 음식 분석과 러닝 계획을 연결해 오늘 바로 실행 가능한 건강 루틴을 만드는 서비스입니다."
};

export default function AboutPage() {
  return (
    <main className="app-shell">
      <section className="glass-card space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">서비스 소개</h1>
          <p className="text-sm leading-relaxed text-zinc-300">
            Eat & Run은 음식 섭취 기록과 운동 실행 사이의 간극을 줄이기 위해 만들어졌습니다. 사용자는 사진
            또는 텍스트로 식사를 기록하고, 시스템은 예상 칼로리를 기반으로 실행 가능한 러닝 코스를 제안합니다.
          </p>
        </header>

        <article className="glass-soft space-y-3 p-4">
          <h2 className="text-lg font-semibold text-white">핵심 가치</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
            <li>과장된 약속보다 실제로 실행 가능한 건강 루틴 제공</li>
            <li>중복 정보 대신 사용자 행동을 돕는 실용적인 콘텐츠 제공</li>
            <li>사용자 경험을 저해하지 않는 명확한 탐색 구조 유지</li>
          </ul>
        </article>

        <article className="glass-soft space-y-3 p-4">
          <h2 className="text-lg font-semibold text-white">콘텐츠 운영 원칙</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            Eat & Run은 자동 생성된 중복 페이지를 대량으로 만들지 않으며, 사용자에게 실제로 도움이 되는 정보와
            기능을 중심으로 페이지를 운영합니다. 광고보다 콘텐츠와 서비스 가치가 우선이며, 사용자가 원하는 정보에
            빠르게 도달할 수 있도록 구조를 관리합니다.
          </p>
        </article>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/privacy" className="btn-ghost px-4 py-2">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="btn-ghost px-4 py-2">
            이용약관
          </Link>
          <Link href="/editorial-policy" className="btn-ghost px-4 py-2">
            운영 원칙
          </Link>
          <Link href="/contact" className="btn-ghost px-4 py-2">
            문의하기
          </Link>
        </div>
      </section>
    </main>
  );
}
