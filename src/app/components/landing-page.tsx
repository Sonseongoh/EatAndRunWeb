"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { CSSProperties } from "react";

const featureCards = [
  {
    title: "사진 한 장으로 칼로리 분석",
    description:
      "음식 사진을 올리면 AI가 음식 종류와 칼로리 범위를 바로 계산해 운동 계획까지 이어집니다.",
    icon: "solar:camera-linear"
  },
  {
    title: "소모 칼로리 맞춤 러닝",
    description:
      "분석된 칼로리를 기준으로 목표 소모량을 설정하고, 오늘 컨디션에 맞는 운동 강도를 추천합니다.",
    icon: "solar:running-round-linear"
  },
  {
    title: "지도 기반 실제 경로 추천",
    description:
      "출발지 주변 도로를 기반으로 거리와 예상 시간을 계산해 바로 뛸 수 있는 코스를 보여줍니다.",
    icon: "solar:map-point-wave-linear"
  },
  {
    title: "히스토리로 루틴 관리",
    description:
      "분석 결과와 활동 기록이 누적되어 지난 주와 비교하며 루틴을 안정적으로 개선할 수 있습니다.",
    icon: "solar:chart-square-linear"
  }
];

// const testimonials = [
//   {
//     name: "김서윤",
//     role: "프로덕트 디자이너",
//     company: "스텝랩",
//     quote:
//       "퇴근 후에 뭘 얼마나 뛰어야 할지 항상 막막했는데, Eat & Run은 사진 올리고 바로 실행하면 돼서 루틴이 끊기지 않았습니다.",
//     rating: "4.9/5"
//   },
//   {
//     name: "박도현",
//     role: "백엔드 엔지니어",
//     company: "런브릿지",
//     quote:
//       "식단 기록 앱은 많았지만 운동 루트까지 연결되는 건 처음이었습니다. 실사용 흐름이 짧아서 꾸준히 쓰기 좋습니다.",
//     rating: "4.8/5"
//   },
//   {
//     name: "이서진",
//     role: "대학원생",
//     company: "모션인사이트",
//     quote:
//       "칼로리 숫자만 보여주는 게 아니라, 실제로 오늘 어디를 뛰면 되는지까지 안내해줘서 실행 부담이 많이 줄었습니다.",
//     rating: "4.9/5"
//   }
// ];

export function LandingPage() {
  useEffect(() => {
    const revealElements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    revealElements.forEach((element) => element.classList.add("reveal-init"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="relative overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.28),transparent_38%),radial-gradient(circle_at_82%_14%,rgba(245,158,11,0.18),transparent_42%),radial-gradient(circle_at_50%_78%,rgba(34,197,94,0.14),transparent_48%)]" />
      <div className="noise-layer pointer-events-none absolute inset-0 z-0 opacity-30" />

      <section className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <div className="grid flex-1 items-center gap-12 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="break-keep-all" data-reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                <iconify-icon icon="solar:bolt-circle-linear" />
                Eat & Run 루틴 자동화
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
                먹은 만큼,
                <br />
                가장 실행하기 쉬운 러닝으로
                <span className="block bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
                  오늘 바로 연결합니다
                </span>
              </h1>
              <p className="mt-6 max-w-[65ch] break-keep-all text-base leading-relaxed text-zinc-300 md:text-lg">
                음식 사진 업로드부터 칼로리 분석, 운동 강도 설정, 지도 기반 러닝 경로 추천까지 한 번에 이어지는 실행형 건강 루틴 서비스입니다.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/analyze"
                  className="group inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-8 py-4 text-lg font-semibold text-zinc-950 transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-emerald-300 active:scale-[0.98]"
                >
                  무료로 시작하기
                  <iconify-icon
                    icon="solar:arrow-right-linear"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="/history"
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/20 px-6 py-4 text-base font-medium text-zinc-200 transition-all duration-300 ease-out hover:scale-[1.02] hover:border-white/35 hover:bg-white/5 active:scale-[0.98]"
                >
                  사용자 기록 보기
                </Link>
              </div>
            </div>

            <div className="relative" data-reveal>
              <div className="absolute -left-10 top-12 hidden h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl lg:block" />
              <div className="absolute -bottom-6 -right-6 hidden h-40 w-40 rounded-full bg-amber-300/20 blur-3xl lg:block" />
              <div className="rounded-3xl border border-white/15 bg-white/5 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-200">오늘 분석 결과</p>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                      3분 내 추천 완료
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <article className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-zinc-400">음식 추정</p>
                      <p className="mt-2 text-lg font-semibold text-white">닭가슴살 샐러드</p>
                    </article>
                    <article className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-zinc-400">칼로리 범위</p>
                      <p className="mt-2 text-lg font-semibold text-white">420-510 kcal</p>
                    </article>
                    <article className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4 sm:col-span-2">
                      <p className="text-xs text-emerald-100/80">추천 러닝 코스</p>
                      <p className="mt-2 text-lg font-semibold text-emerald-100">한강공원 6.2km 루프 코스</p>
                      <p className="mt-2 text-sm text-emerald-50/80">예상 소모 468 kcal · 약 42분</p>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="break-keep-all" data-reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">핵심 기능</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              기록이 아니라,
              <br />
              실행까지 닿는 설계
            </h2>
            <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-zinc-300 md:text-lg">
              Eat & Run은 데이터만 쌓는 서비스가 아닙니다. 사용자가 지금 당장 움직일 수 있게 흐름을 줄이고 선택을 자동화했습니다.
            </p>
          </div>

          <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 sm:grid-cols-2" data-reveal>
            {featureCards.map((feature, index) => (
              <article
                key={feature.title}
                className={`reveal-item rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-200/30 hover:bg-white/[0.07] ${
                  index === 0 ? "sm:col-span-2" : ""
                }`}
                style={{ ["--index" as string]: index } as CSSProperties}
              >
                <iconify-icon icon={feature.icon} className="text-2xl text-emerald-200" />
                <h3 className="mt-4 break-keep-all text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 break-keep-all text-sm leading-relaxed text-zinc-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* <section className="relative z-10 border-y border-white/10 bg-zinc-900/50 py-24 lg:py-32">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="break-keep-all" data-reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">사용자 후기</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                숫자보다 중요한 건
                <br />
                루틴의 지속성입니다
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2" data-reveal>
              {testimonials.map((testimonial, index) => (
                <article
                  key={testimonial.name}
                  className={`reveal-item rounded-2xl border border-white/10 bg-white/[0.045] p-6 ${
                    index === 2 ? "md:col-span-2" : ""
                  }`}
                  style={{ ["--index" as string]: index } as CSSProperties}
                >
                  <p className="break-keep-all text-sm leading-relaxed text-zinc-200">{testimonial.quote}</p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                      <p className="text-xs text-zinc-400">{testimonial.role} · {testimonial.company}</p>
                    </div>
                    <span className="rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold tabular-nums text-amber-100">
                      {testimonial.rating}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32" data-reveal>
        <div className="rounded-3xl border border-emerald-200/20 bg-[linear-gradient(130deg,rgba(16,185,129,0.24),rgba(10,10,10,0.65)_62%)] p-8 backdrop-blur xl:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="break-keep-all">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">지금 시작하기</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                오늘 먹은 한 끼,
                <br />
                오늘 끝낼 러닝 계획으로 바꿔보세요
              </h2>
              <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-emerald-50/90 md:text-lg">
                업로드부터 추천까지 3분 이내. 계산은 서비스가 맡고, 사용자는 바로 뛰기만 하면 됩니다.
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-zinc-950/45 p-6">
              <Link
                href="/analyze"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-zinc-900 transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-zinc-100 active:scale-[0.98]"
              >
                러닝 계획 생성하기
                <iconify-icon
                  icon="solar:arrow-right-up-linear"
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/history"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-6 py-4 text-base font-medium text-zinc-100 transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white/10 active:scale-[0.98]"
              >
                누적 기록 확인하기
              </Link>
              <p className="text-center text-xs text-zinc-300">회원가입 없이 체험 가능 · 평균 3분 내 첫 코스 생성</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-zinc-950/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="break-keep-all">
            <p className="text-lg font-semibold text-white">Eat & Run</p>
            <p className="mt-2 text-sm text-zinc-400">먹은 만큼 똑똑하게 달리는 실행형 건강 루틴 서비스</p>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <Link href="/analyze" className="rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white">
              시작하기
            </Link>
            <Link href="/history" className="rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white">
              기록 보기
            </Link>
            <Link href="/map" className="rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white">
              지도 미리보기
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
