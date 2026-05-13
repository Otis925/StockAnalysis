'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, Target, TrendingUp, Cpu, Shield, Zap } from 'lucide-react';
import { TickerInput } from '@/components/TickerInput';

const RECENT_KEY = 'peerlens_recent';
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}
function saveRecent(ticker: string) {
  try {
    const recent = [ticker, ...getRecent().filter(t => t !== ticker)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {}
}

const FEATURES = [
  { Icon: BarChart3, color: '#22d3ee', label: '9-Component Score', desc: 'Price, sector, fundamentals' },
  { Icon: Target,    color: '#a78bfa', label: 'Point-in-Time Safe', desc: 'No lookahead bias' },
  { Icon: TrendingUp,color: '#34d399', label: 'EDGAR Fundamentals', desc: 'SEC-sourced financials' },
  { Icon: Cpu,       color: '#fb923c', label: 'Deterministic', desc: 'Same input, same output' },
  { Icon: Shield,    color: '#f472b6', label: 'Auditable', desc: 'Full score breakdown' },
  { Icon: Zap,       color: '#facc15', label: 'Instant Results', desc: 'Sub-second peer ranking' },
];

const EXAMPLE_TICKERS = ['NVDA', 'MSFT', 'AAPL', 'GOOG', 'META', 'TSLA'];

export default function HomePage() {
  const router = useRouter();
  const [ticker, setTicker] = useState('');
  const [watchlistSize, setWatchlistSize] = useState<10 | 25 | 50>(25);
  const [sectorLock, setSectorLock] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minCap, setMinCap] = useState('');
  const [maxCap, setMaxCap] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) { setError('Please enter a ticker symbol.'); return; }
    setError('');
    saveRecent(ticker.toUpperCase());
    const params = new URLSearchParams({
      watchlist_size: watchlistSize.toString(),
      sector_lock: sectorLock.toString(),
      ...(minCap ? { min_cap: minCap } : {}),
      ...(maxCap ? { max_cap: maxCap } : {}),
    });
    router.push(`/results/${ticker.toUpperCase()}?${params}`);
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      {/* Radial glow at center */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.08) 0%, transparent 70%)' }} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">

        {/* Badge */}
        <div className="mb-8 animate-fade-up"
          style={{ animationDelay: '0ms' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{ background: 'rgba(34,211,238,0.08)', borderColor: 'rgba(34,211,238,0.2)', color: '#22d3ee' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Deterministic · Point-in-Time · Auditable
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-4 animate-fade-up max-w-3xl"
          style={{ animationDelay: '80ms' }}>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none mb-6">
            <span className="gradient-text">Find stocks</span>
            <br />
            <span style={{ color: 'var(--text-secondary)' }}>that behave like yours.</span>
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Enter one ticker. Get ranked peers scored on price behavior, sector classification,
            and real fundamentals. No black boxes.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-3 animate-fade-up"
          style={{ animationDelay: '160ms' }}>
          <div className="flex gap-2">
            <TickerInput value={ticker} onChange={setTicker} className="flex-1" autoFocus />
            <button
              type="submit"
              disabled={!ticker.trim()}
              className="btn-primary flex items-center gap-2 px-6 py-4 rounded-xl font-semibold whitespace-nowrap"
            >
              Analyze <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {error && <p className="text-sm text-red-400 px-1">{error}</p>}

          {/* Quick picks */}
          <div className="flex items-center gap-2 flex-wrap px-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Try:</span>
            {EXAMPLE_TICKERS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTicker(t)}
                className="font-mono text-xs px-2 py-0.5 rounded border transition-all duration-150"
                style={{
                  borderColor: 'var(--border)',
                  color: ticker === t ? '#22d3ee' : 'var(--text-secondary)',
                  background: ticker === t ? 'rgba(34,211,238,0.08)' : 'transparent',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Advanced toggle */}
          <div>
            <button type="button" onClick={() => setShowAdvanced(v => !v)}
              className="text-xs transition-colors px-1"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              {showAdvanced ? '▲' : '▼'} Advanced options
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 rounded-xl glass space-y-4">
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Watchlist size</label>
                    <div className="flex gap-2">
                      {([10, 25, 50] as const).map(n => (
                        <button key={n} type="button" onClick={() => setWatchlistSize(n)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            watchlistSize === n
                              ? 'text-cyan-400 border border-cyan-400/30 bg-cyan-400/10'
                              : 'border border-[var(--border)] text-slate-400 hover:text-slate-200 hover:border-[var(--border-hover)]'
                          }`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Market cap (USD M)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Min" value={minCap} onChange={e => setMinCap(e.target.value)}
                        className="w-24 px-2 py-1.5 text-sm rounded-lg input-tech" />
                      <span style={{ color: 'var(--text-muted)' }}>–</span>
                      <input type="number" placeholder="Max" value={maxCap} onChange={e => setMaxCap(e.target.value)}
                        className="w-24 px-2 py-1.5 text-sm rounded-lg input-tech" />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      sectorLock ? 'border-cyan-400 bg-cyan-400/20' : 'border-slate-600 group-hover:border-slate-400'
                    }`}
                      onClick={() => setSectorLock(v => !v)}>
                      {sectorLock && <div className="w-2 h-2 rounded-sm bg-cyan-400" />}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sector lock</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Feature grid */}
        <div className="mt-16 w-full max-w-3xl animate-fade-up" style={{ animationDelay: '240ms' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FEATURES.map(({ Icon, color, label, desc }) => (
              <div key={label} className="glass rounded-xl p-4 flex items-start gap-3 transition-all">
                <div className="mt-0.5 p-1.5 rounded-md shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
