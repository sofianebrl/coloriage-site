import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "CoachManager — gérez votre équipe",
  description:
    "Application pour les coachs : gérez vos groupes, le calendrier des entraînements et les présences.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <StoreProvider>
          <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
            <main className="flex-1 px-4 pb-28 pt-6">{children}</main>
            <Nav />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
