"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { href: "/", label: "홈" },
  { href: "/analyze", label: "시작하기" },
  { href: "/history", label: "기록" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight text-white transition-opacity hover:opacity-80"
        >
          Eat & Run
        </Link>
        <div className="flex items-center gap-2">
          {menus.map((menu) => {
            const active =
              menu.href === "/analyze"
                ? ["/analyze", "/activity", "/map"].includes(pathname)
                : pathname === menu.href;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  active
                    ? "bg-emerald-400 text-zinc-950"
                    : "text-zinc-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                {menu.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
