"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

// L'accueil est un dashboard plein écran (sombre) ; les autres pages
// gardent un conteneur clair centré.
export function MainArea({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return <main className="min-w-0 flex-1">{children}</main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6 md:pb-10">
      {children}
    </main>
  );
}
