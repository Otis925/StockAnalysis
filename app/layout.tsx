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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-white border-b"
          style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#00C805"/>
                <path d="M6 10.5L9 13.5L14 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
                PeerLens
              </span>
            </a>
            <NavMenu />
          </div>
        </nav>

        <main className="flex-1">{children}</main>

        <footer className="border-t py-8 mt-16" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              PeerLens v3.0 · For research purposes only · Not investment advice ·
              Scores are algorithmic outputs from public data
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
