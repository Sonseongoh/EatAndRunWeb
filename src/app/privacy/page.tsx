import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | Eat & Run",
  description: "Eat & Run 서비스의 개인정보 수집, 이용, 보관, 파기 정책을 안내합니다."
};

export default function PrivacyPage() {
  return (
    <main className="app-shell">
      <section className="glass-card space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">개인정보처리방침</h1>
          <p className="text-sm text-zinc-400">최종 업데이트: 2026-04-07</p>
          <p className="text-sm leading-relaxed text-zinc-300">
            Eat & Run은 서비스 제공에 필요한 최소한의 개인정보만 처리하며, 관련 법령 및 플랫폼 정책을 준수합니다.
          </p>
        </header>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. 수집하는 정보</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            계정 로그인 정보(이메일 또는 OAuth 계정 식별자), 사용자가 입력한 활동 기록(식사 정보, 운동 기록),
            서비스 안정화에 필요한 기기/로그 정보가 포함될 수 있습니다.
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. 이용 목적</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            사용자 인증, 식사/운동 기록 저장, 맞춤 추천 제공, 부정 이용 방지, 서비스 품질 개선을 위해 활용합니다.
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. 보관 및 파기</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            관련 법령에 따른 보관 의무가 없는 경우, 이용 목적 달성 후 합리적인 기간 내 파기합니다.
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. 제3자 제공 및 처리 위탁</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            인증, 인프라 운영 등 서비스 제공을 위해 필요한 범위 내에서 외부 서비스 제공자를 이용할 수 있으며,
            해당 범위를 넘어 임의로 판매하거나 공유하지 않습니다.
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">5. 사용자 권리</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            사용자는 개인정보 조회, 정정, 삭제 요청을 할 수 있으며, 법령에 따라 일부 제한될 수 있습니다.
          </p>
        </article>
      </section>
    </main>
  );
}
