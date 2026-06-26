import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";
import { MainArea } from "@/components/MainArea";

export const metadata: Metadata = {
  title: "CoachManager — gérez votre équipe",
  description:
    "Application pour les coachs : gérez vos groupes, le calendrier des entraînements et les présences.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f7f8fa",
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
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <MainArea>{children}</MainArea>
              <Nav />
            </div>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
