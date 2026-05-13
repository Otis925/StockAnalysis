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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full`}>
      <body className="min-h-full flex flex-col">
        {/* Nav */}
        <nav className="sticky top-0 z-50 border-b border-[var(--border)] backdrop-blur-xl"
          style={{ background: 'rgba(2, 8, 23, 0.85)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0891b2, #2563eb)', boxShadow: '0 0 12px rgba(34,211,238,0.35)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="white" strokeWidth="1.2" fill="none"/>
                  <circle cx="7" cy="7" r="2" fill="white"/>
                </svg>
              </div>
              <span className="font-bold text-base tracking-tight"
                style={{ background: 'linear-gradient(90deg, #e2e8f0, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PeerLens
              </span>
            </a>

            <NavMenu />
          </div>
        </nav>

        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] py-6 mt-16">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0891b2, #2563eb)' }}>
                <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
                  <circle cx="7" cy="7" r="2" fill="white"/>
                </svg>
              </div>
              <span className="text-xs font-semibold" style={{ color: '#22d3ee' }}>PeerLens</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>v3.0</span>
            </div>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              For internal research only · Not investment advice · Scores derived from public data
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
