import type { Metadata } from "next";
import { getServerLocale, pickByLocale } from "@/lib/locale-server";

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@eatrun.app";

export const metadata: Metadata = {
  title: "문의하기 | Eat & Run",
  description: "Eat & Run 서비스 이용 중 문의 및 제휴 요청을 접수합니다."
};

export default async function ContactPage() {
  const locale = await getServerLocale();
  const t = (ko: string, en: string) => pickByLocale(locale, ko, en);

  return (
    <main className="app-shell">
      <section className="glass-card space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{t("문의하기", "Contact")}</h1>
          <p className="text-sm leading-relaxed text-zinc-300">
            {t(
              "서비스 오류 제보, 광고/정책 문의, 제휴 요청은 아래 이메일로 보내주세요.",
              "For bug reports, policy/ads questions, or partnerships, send us an email below."
            )}
          </p>
        </header>

        <article className="glass-soft space-y-3 p-4">
          <h2 className="text-lg font-semibold text-white">{t("고객지원 이메일", "Support email")}</h2>
          <p className="text-sm text-zinc-300">
            <a
              href={`mailto:${supportEmail}`}
              className="underline decoration-zinc-500 underline-offset-4 hover:text-white"
            >
              {supportEmail}
            </a>
          </p>
          <p className="text-xs text-zinc-400">
            {t("평일 기준 2영업일 이내 답변을 목표로 합니다.", "We aim to respond within 2 business days.")}
          </p>
        </article>
      </section>
    </main>
  );
}

