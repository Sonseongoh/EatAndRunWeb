import type { Metadata } from "next";
import { getServerLocale, pickByLocale } from "@/lib/locale-server";

export const metadata: Metadata = {
  title: "개인정보처리방침 | Eat & Run",
  description: "Eat & Run 서비스의 개인정보 수집, 이용, 보관, 파기 정책을 안내합니다."
};

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const t = (ko: string, en: string) => pickByLocale(locale, ko, en);

  return (
    <main className="app-shell">
      <section className="glass-card space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{t("개인정보처리방침", "Privacy Policy")}</h1>
          <p className="text-sm text-zinc-400">{t("최종 업데이트: 2026-04-07", "Last updated: 2026-04-07")}</p>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "Eat & Run은 서비스 제공에 필요한 최소한의 개인정보만 처리하며, 관련 법령 및 플랫폼 정책을 준수합니다.",
              "Eat & Run processes only the minimum personal data required to provide the service and follows relevant laws and platform policies."
            )}
          </p>
        </header>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">{t("1. 수집하는 정보", "1. Information we collect")}</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "계정 로그인 정보(이메일 또는 OAuth 계정 식별자), 사용자가 입력한 활동 기록(식사 정보, 운동 기록), 서비스 안정화에 필요한 기기/로그 정보가 포함될 수 있습니다.",
              "This may include login information (email or OAuth identifier), user-entered activity logs (meal and workout records), and device/log information needed for service stability."
            )}
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">{t("2. 이용 목적", "2. Purpose of use")}</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "사용자 인증, 식사/운동 기록 저장, 맞춤 추천 제공, 부정 이용 방지, 서비스 품질 개선을 위해 활용합니다.",
              "Used for user authentication, storing meal/workout history, personalized recommendations, abuse prevention, and service quality improvements."
            )}
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">{t("3. 보관 및 파기", "3. Retention and deletion")}</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "관련 법령에 따른 보관 의무가 없는 경우, 이용 목적 달성 후 합리적인 기간 내 파기합니다.",
              "If no legal retention obligation exists, data is deleted within a reasonable period after the purpose is fulfilled."
            )}
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">{t("4. 제3자 제공 및 처리 위탁", "4. Third-party sharing and processing")}</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "인증, 인프라 운영 등 서비스 제공을 위해 필요한 범위 내에서 외부 서비스 제공자를 이용할 수 있으며, 해당 범위를 넘어 임의로 판매하거나 공유하지 않습니다.",
              "We may use external providers for authentication and infrastructure within necessary scope. Data is not sold or shared beyond that scope."
            )}
          </p>
        </article>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold text-white">{t("5. 사용자 권리", "5. User rights")}</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "사용자는 개인정보 조회, 정정, 삭제 요청을 할 수 있으며, 법령에 따라 일부 제한될 수 있습니다.",
              "Users can request access, correction, or deletion of personal data, subject to legal limitations."
            )}
          </p>
        </article>
      </section>
    </main>
  );
}

