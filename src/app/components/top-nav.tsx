"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { useFlowStore } from "@/store/use-flow-store";

const menus = [
  { href: "/", labelKo: "홈", labelEn: "Home" },
  { href: "/about", labelKo: "서비스 소개", labelEn: "About", mobileLabelKo: "소개", mobileLabelEn: "About" },
  { href: "/analyze", labelKo: "시작하기", labelEn: "Start", mobileLabelKo: "시작", mobileLabelEn: "Start" },
  { href: "/history", labelKo: "기록", labelEn: "History" }
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const resetFlow = useFlowStore((state) => state.resetFlow);

  async function onLogout() {
    await signOut();
    resetFlow();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="whitespace-nowrap text-sm font-bold tracking-tight text-white transition-opacity hover:opacity-80"
        >
          Eat &amp; Run
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {menus.map((menu) => {
            const active =
              menu.href === "/analyze"
                ? ["/analyze", "/activity", "/map"].includes(pathname)
                : pathname === menu.href;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-semibold sm:px-3 sm:text-sm ${
                  active
                    ? "bg-emerald-400 text-zinc-950"
                    : "text-zinc-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="sm:hidden">
                  {locale === "ko"
                    ? menu.mobileLabelKo ?? menu.labelKo
                    : menu.mobileLabelEn ?? menu.labelEn}
                </span>
                <span className="hidden sm:inline">{locale === "ko" ? menu.labelKo : menu.labelEn}</span>
              </Link>
            );
          })}
          <div className="ml-1 inline-flex overflow-hidden rounded-md border border-white/20">
            <button
              type="button"
              onClick={() => setLocale("ko")}
              className={`px-2 py-1.5 text-[11px] font-semibold sm:text-xs ${
                locale === "ko" ? "bg-white/90 text-zinc-900" : "text-zinc-200 hover:bg-white/10"
              }`}
            >
              KO
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`px-2 py-1.5 text-[11px] font-semibold sm:text-xs ${
                locale === "en" ? "bg-white/90 text-zinc-900" : "text-zinc-200 hover:bg-white/10"
              }`}
            >
              EN
            </button>
          </div>
          {!isLoading && !isAuthenticated ? (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-md border border-white/20 px-2 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-white/10 sm:px-3 sm:text-sm"
            >
              {t("로그인", "Login")}
            </Link>
          ) : null}
          {!isLoading && isAuthenticated ? (
            <button
              type="button"
              onClick={() => void onLogout()}
              className="whitespace-nowrap rounded-md border border-white/20 px-2 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-white/10 sm:px-3 sm:text-sm"
            >
              {t("로그아웃", "Log out")}
            </button>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
