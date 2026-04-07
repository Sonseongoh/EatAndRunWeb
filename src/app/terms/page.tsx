import type { Metadata } from "next";
import { getServerLocale, pickByLocale } from "@/lib/locale-server";

export const metadata: Metadata = {
  title: "이용약관 | Eat & Run",
  description: "Eat & Run 서비스 이용 시 적용되는 기본 약관입니다."
};

export default async function TermsPage() {
  const locale = await getServerLocale();
  const t = (ko: string, en: string) => pickByLocale(locale, ko, en);

  return (
    <main className="app-shell">
      <section className="glass-card space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{t("이용약관", "Terms of Service")}</h1>
          <p className="text-sm text-zinc-400">{t("최종 업데이트: 2026-04-07", "Last updated: 2026-04-07")}</p>
        </header>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">{t("1. 서비스 목적", "1. Service purpose")}</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "Eat & Run은 식사 기록과 운동 계획 수립을 지원하는 정보성 서비스를 제공합니다.",
              "Eat & Run provides an informational service to support meal tracking and workout planning."
            )}
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">{t("2. 이용자의 책임", "2. User responsibilities")}</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "이용자는 정확한 정보 입력과 안전한 계정 관리에 책임을 가지며, 관련 법령 및 서비스 정책을 준수해야 합니다.",
              "Users are responsible for accurate input and secure account management, and must comply with laws and service policies."
            )}
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">{t("3. 금지 행위", "3. Prohibited actions")}</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "자동화된 비정상 트래픽 생성, 타인의 계정 도용, 서비스 운영 방해, 불법 콘텐츠 게시 등은 금지됩니다.",
              "Automated abnormal traffic, account impersonation, service disruption, and illegal content posting are prohibited."
            )}
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">{t("4. 콘텐츠 및 책임 제한", "4. Content and liability limitation")}</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "본 서비스가 제공하는 칼로리 추정 및 운동 추천은 참고 정보이며, 개인의 건강 상태에 따라 전문가 상담이 필요할 수 있습니다.",
              "Calorie estimates and workout recommendations are for reference. Professional advice may be needed based on individual health conditions."
            )}
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">{t("5. 약관 변경", "5. Terms updates")}</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "약관 변경 시 서비스 내 공지 또는 관련 페이지를 통해 사전에 안내합니다.",
              "If terms are updated, we will provide prior notice in-service or via related pages."
            )}
          </p>
        </article>
      </section>
    </main>
  );
}

