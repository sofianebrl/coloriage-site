"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navConfig";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center gap-2 border-r border-[#2a2040] bg-[#120b1f] py-5 md:flex">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5188c] text-sm font-extrabold text-white shadow-[0_0_18px_rgba(245,24,140,0.55)]">
        CM
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
                active
                  ? "bg-[#f5188c]/15 text-[#f5188c] shadow-[0_0_14px_rgba(245,24,140,0.35)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute left-0 h-6 w-0.5 rounded-full bg-[#f5188c]" />
              )}
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#f5188c] text-[10px] font-extrabold text-[#f5188c] shadow-[0_0_14px_rgba(245,24,140,0.4)]">
        DYF
      </div>
    </aside>
  );
}
