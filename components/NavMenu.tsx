'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { href: '/screen',    label: 'Screener' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/watchlist', label: 'Watchlists' },
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
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <a key={href} href={href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: active ? 'var(--green-dk)' : 'var(--text-secondary)',
                background: active ? '#E6FAE6' : 'transparent',
                fontWeight: active ? 600 : 500,
              }}>
              {label}
            </a>
          );
        })}
      </div>

      <div className="w-px h-5 hidden sm:block mx-1" style={{ background: 'var(--border)' }} />

      {email ? (
        <div className="flex items-center gap-2">
          <span className="hidden md:block text-xs truncate max-w-[120px]" style={{ color: 'var(--text-muted)' }}>
            {email.split('@')[0]}
          </span>
          <button onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg font-medium btn-ghost">
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <a href="/auth/login"
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            Log in
          </a>
          <a href="/auth/register"
            className="btn-green text-sm px-4 py-1.5">
            Sign up
          </a>
        </div>
      )}
    </div>
  );
}
