'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register, ApiError } from '@/lib/api';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(null);
    setLoading(true);
    try {
      const tok = await register(email, password);
      localStorage.setItem('pl_token', tok.access_token);
      localStorage.setItem('pl_email', tok.email);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(34,211,238,0.05) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="glass rounded-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #0891b2, #2563eb)', boxShadow: '0 0 24px rgba(34,211,238,0.3)' }}>
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Create account</h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Save watchlists and screens</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className="w-full px-3 py-2.5 rounded-lg text-sm input-tech" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 characters" className="w-full px-3 py-2.5 rounded-lg text-sm input-tech" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm password</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" className="w-full px-3 py-2.5 rounded-lg text-sm input-tech" />
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg"
                style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold mt-2">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <a href="/auth/login" style={{ color: '#22d3ee' }}>Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
