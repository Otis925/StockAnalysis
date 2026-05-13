'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { href: '/screen', label: 'Screen' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/watchlist', label: 'Watchlists' },
];

export default function NavMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(localStorage.getItem('pl_email'));
  }, []);

  function handleLogout() {
    localStorage.removeItem('pl_token');
    localStorage.removeItem('pl_email');
    setEmail(null);
    router.push('/');
  }

  const linkCls = (href: string) =>
    `text-sm font-medium transition-colors ${
      pathname === href
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
    }`;

  return (
    <div className="flex items-center gap-5">
      <div className="hidden sm:flex items-center gap-5">
        {NAV_LINKS.map(({ href, label }) => (
          <a key={href} href={href} className={linkCls(href)}>{label}</a>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {email ? (
          <>
            <span className="hidden sm:block text-xs text-gray-400 truncate max-w-[140px]">{email}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700"
            >
              Sign out
            </button>
          </>
        ) : (
          <a
            href="/auth/login"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
          >
            Sign in
          </a>
        )}
      </div>
    </div>
  );
}
