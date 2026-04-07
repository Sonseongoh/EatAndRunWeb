import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "콘텐츠 운영 원칙 | Eat & Run",
  description: "Eat & Run의 콘텐츠 제작 기준, 광고 노출 기준, 품질 관리 원칙을 안내합니다."
};

export default function EditorialPolicyPage() {
  return (
    <main className="app-shell">
      <section className="glass-card space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">콘텐츠 및 광고 운영 원칙</h1>
          <p className="text-sm leading-relaxed text-zinc-300">
            Eat & Run은 사용자에게 유익한 건강 루틴 정보를 우선하며, 광고는 콘텐츠를 대체하지 않고 보조하는
            수준에서 운영합니다.
          </p>
        </header>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. 중복/저품질 콘텐츠 지양</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            동일한 내용을 반복하는 페이지를 대량 생성하지 않으며, 자동 생성 문서만으로 구성된 페이지를 운영하지
            않습니다. 모든 핵심 페이지는 사용자 행동에 도움이 되는 목적을 갖습니다.
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. 사용자 중심 탐색 구조</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            사용자가 필요한 정보에 빠르게 도달할 수 있도록 명확한 내비게이션과 정책 페이지 링크를 제공합니다.
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. 광고와 콘텐츠의 균형</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            광고는 콘텐츠보다 과도하게 눈에 띄지 않도록 배치하며, 본문이 거의 없는 페이지나 오류 페이지에 광고를
            우선적으로 배치하지 않습니다.
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. 신뢰성과 투명성</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            서비스 소개, 이용약관, 개인정보처리방침, 문의 채널을 상시 공개합니다. 사용자에게 약속한 기능과 정보를
            실제 서비스에서 일관되게 제공합니다.
          </p>
        </article>
      </section>
    </main>
  );
}
