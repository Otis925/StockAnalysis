'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart2, Briefcase, BookMarked, LogIn, LogOut } from 'lucide-react';

const NAV_LINKS = [
  { href: '/screen',    label: 'Screen',     Icon: BarChart2 },
  { href: '/portfolio', label: 'Portfolio',   Icon: Briefcase },
  { href: '/watchlist', label: 'Watchlists',  Icon: BookMarked },
];

export default function NavMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => { setEmail(localStorage.getItem('pl_email')); }, []);

  function handleLogout() {
    localStorage.removeItem('pl_token');
    localStorage.removeItem('pl_email');
    setEmail(null);
    router.push('/');
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div className="hidden sm:flex items-center gap-1">
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <a
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                active
                  ? 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
              style={active ? { textShadow: '0 0 12px rgba(34,211,238,0.5)' } : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </a>
          );
        })}
      </div>

      <div className="w-px h-5 bg-[var(--border)] hidden sm:block mx-1" />

      {email ? (
        <div className="flex items-center gap-2">
          <span className="hidden md:block text-xs font-mono px-2 py-1 rounded border border-[var(--border)]"
            style={{ color: 'var(--text-muted)' }}>
            {email.split('@')[0]}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-all btn-ghost"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      ) : (
        <a
          href="/auth/login"
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all btn-ghost"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign in</span>
        </a>
      )}
    </div>
  );
}
