'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tok = await login(email, password);
      localStorage.setItem('pl_token', tok.access_token);
      localStorage.setItem('pl_email', tok.email);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4"
      style={{ background: 'var(--bg-surface)' }}>
      <div className="w-full max-w-sm animate-fade-up">
        <div className="card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-4">
              <circle cx="20" cy="20" r="20" fill="#00C805"/>
              <path d="M11 20.5L17.5 27L29 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Sign in to your PeerLens account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm input-rh" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm input-rh" />
            </div>

            {error && (
              <p className="text-sm px-4 py-3 rounded-xl"
                style={{ color: '#CC3D00', background: '#FFF0EB', border: '1px solid #FFCFBB' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="btn-green w-full py-3.5 text-sm font-semibold mt-2">
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <a href="/auth/register" className="font-semibold" style={{ color: 'var(--green-dk)' }}>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
