import type { Metadata } from "next";
import Link from "next/link";
import { getServerLocale, pickByLocale } from "@/lib/locale-server";

const faqItems = [
  {
    questionKo: "Eat & Run은 무엇을 해주는 서비스인가요?",
    questionEn: "What does Eat & Run do?",
    answerKo:
      "음식 사진이나 텍스트로 식사를 기록하면 예상 칼로리를 분석하고, 그 섭취량을 바탕으로 오늘 바로 실행할 수 있는 러닝 강도와 경로를 제안하는 서비스입니다.",
    answerEn:
      "It analyzes meal calories from a photo or text entry, then recommends a runnable workout intensity and route based on that intake."
  },
  {
    questionKo: "칼로리 분석 결과는 어떻게 활용되나요?",
    questionEn: "How is the calorie estimate used?",
    answerKo:
      "예상 섭취 칼로리를 기준으로 목표 소모량을 계산하고, 사용자의 체중과 운동 방식을 함께 고려해 필요한 운동 시간을 제안합니다.",
    answerEn:
      "Estimated intake is converted into a target calorie burn, then combined with body weight and activity type to suggest workout duration."
  },
  {
    questionKo: "러닝 경로 추천은 어떤 기준으로 만들어지나요?",
    questionEn: "How are running routes recommended?",
    answerKo:
      "출발 위치 주변 도로 데이터를 기준으로 거리, 예상 시간, 목표 소모 칼로리에 맞는 후보 경로를 계산해 보여줍니다.",
    answerEn:
      "Route candidates are generated from nearby road data around the starting point, then filtered by distance, estimated time, and target calorie burn."
  },
  {
    questionKo: "회원가입 없이도 사용할 수 있나요?",
    questionEn: "Can I use it without signing up?",
    answerKo:
      "홈페이지와 공개 안내 페이지는 누구나 볼 수 있지만, 개인 분석 결과 저장과 히스토리 기능은 로그인 후 이용하는 구조입니다.",
    answerEn:
      "Anyone can browse the homepage and public guide pages, but personal analysis storage and history features require sign-in."
  },
  {
    questionKo: "Eat & Run이 의료 서비스를 대체하나요?",
    questionEn: "Does Eat & Run replace medical advice?",
    answerKo:
      "아닙니다. 이 서비스의 칼로리 추정과 운동 제안은 일반적인 참고 정보이며, 건강 상태에 따라 전문가 상담이 필요할 수 있습니다.",
    answerEn:
      "No. Calorie estimates and workout suggestions are general guidance only, and professional advice may be needed depending on your health condition."
  }
];

export const metadata: Metadata = {
  title: "자주 묻는 질문 | Eat & Run",
  description: "Eat & Run의 칼로리 분석, 러닝 경로 추천, 로그인과 기록 기능에 대한 자주 묻는 질문을 확인하세요."
};

export default async function FaqPage() {
  const locale = await getServerLocale();
  const t = (ko: string, en: string) => pickByLocale(locale, ko, en);

  return (
    <main className="app-shell">
      <section className="glass-card space-y-6">
        <header className="space-y-3 text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{t("자주 묻는 질문", "Frequently asked questions")}</h1>
          <p className="mx-auto max-w-4xl break-keep text-sm leading-relaxed text-zinc-300">
            {t(
              "Eat & Run의 핵심 기능, 사용 방식, 기록 구조에 대해 가장 자주 들어오는 질문을 한 곳에 정리했습니다.",
              "This page collects the most common questions about Eat & Run features, usage flow, and record handling."
            )}
          </p>
        </header>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <article key={item.questionKo} className="glass-soft space-y-3 p-4">
              <h2 className="text-lg font-semibold text-white">
                {locale === "ko" ? item.questionKo : item.questionEn}
              </h2>
              <p className="text-sm leading-relaxed text-zinc-300">
                {locale === "ko" ? item.answerKo : item.answerEn}
              </p>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/about" className="btn-ghost px-4 py-2">
            {t("서비스 소개", "About")}
          </Link>
          <Link href="/editorial-policy" className="btn-ghost px-4 py-2">
            {t("운영 원칙", "Policy")}
          </Link>
          <Link href="/contact" className="btn-ghost px-4 py-2">
            {t("문의하기", "Contact")}
          </Link>
        </div>
      </section>
    </main>
  );
}
