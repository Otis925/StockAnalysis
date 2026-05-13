import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavMenu from "@/components/NavMenu";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PeerLens — Similar Stock Discovery",
  description: "Find similar stocks using deterministic scoring across price behavior, sector, and financials.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[--background]">
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white shrink-0">
              <span className="text-blue-600">◆</span> PeerLens
            </a>
            <NavMenu />
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400">
            PeerLens v3.0 · For internal research purposes only · Not investment advice ·{" "}
            Scores are algorithmic outputs from public data as of stated date.
          </div>
        </footer>
      </body>
    </html>
  );
}
