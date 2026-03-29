"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { href: "/", label: "홈" },
  { href: "/history", label: "기록" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 md:px-8">
        <p className="text-sm font-bold text-slate-900">Eat & Run</p>
        <div className="flex items-center gap-2">
          {menus.map((menu) => {
            const active = pathname === menu.href;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  active
                    ? "bg-mint-500 text-white"
                    : "text-slate-700 hover:bg-slate-100"
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
