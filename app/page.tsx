'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, TrendingUp, BarChart2, Shield } from 'lucide-react';
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

const POPULAR = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'META', 'GOOG'];

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
    if (!ticker.trim()) { setError('Enter a ticker symbol to continue.'); return; }
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
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-20 pb-16">
        <div className="w-full max-w-xl text-center animate-fade-up">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight"
            style={{ color: 'var(--text-primary)' }}>
            Discover your
            <span style={{ color: 'var(--green)' }}> stock&apos;s</span>
            <br />closest peers.
          </h1>
          <p className="text-base mb-10" style={{ color: 'var(--text-secondary)' }}>
            Enter any ticker and get ranked peers scored on price behavior,
            sector, and fundamentals — in seconds.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <TickerInput value={ticker} onChange={setTicker} className="flex-1" autoFocus />
              <button type="submit" disabled={!ticker.trim()}
                className="btn-green flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap">
                Analyze <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-sm text-left" style={{ color: 'var(--red)' }}>{error}</p>}

            {/* Popular tickers */}
            <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Popular:</span>
              {POPULAR.map(t => (
                <button key={t} type="button" onClick={() => setTicker(t)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all"
                  style={{
                    borderColor: ticker === t ? 'var(--green)' : 'var(--border)',
                    color: ticker === t ? 'var(--green-dk)' : 'var(--text-secondary)',
                    background: ticker === t ? '#E6FAE6' : 'transparent',
                  }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Advanced toggle */}
            <div className="text-left">
              <button type="button" onClick={() => setShowAdvanced(v => !v)}
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                {showAdvanced ? '▲ Hide' : '▼ Advanced'} options
              </button>
              {showAdvanced && (
                <div className="mt-3 p-4 rounded-xl card space-y-4">
                  <div className="flex items-center gap-6 flex-wrap">
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Watchlist size
                      </label>
                      <div className="flex gap-2">
                        {([10, 25, 50] as const).map(n => (
                          <button key={n} type="button" onClick={() => setWatchlistSize(n)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                            style={{
                              borderColor: watchlistSize === n ? 'var(--green)' : 'var(--border)',
                              color: watchlistSize === n ? 'var(--green-dk)' : 'var(--text-secondary)',
                              background: watchlistSize === n ? '#E6FAE6' : 'transparent',
                              fontWeight: watchlistSize === n ? 600 : 400,
                            }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Market cap (USD M)
                      </label>
                      <div className="flex items-center gap-2">
                        <input type="number" placeholder="Min" value={minCap} onChange={e => setMinCap(e.target.value)}
                          className="w-24 px-3 py-1.5 text-sm input-rh" />
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                        <input type="number" placeholder="Max" value={maxCap} onChange={e => setMaxCap(e.target.value)}
                          className="w-24 px-3 py-1.5 text-sm input-rh" />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="w-9 h-5 rounded-full relative transition-colors cursor-pointer"
                        style={{ background: sectorLock ? 'var(--green)' : '#D0D0D0' }}
                        onClick={() => setSectorLock(v => !v)}>
                        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                          style={{ left: sectorLock ? '18px' : '2px' }} />
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sector lock</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t py-12 px-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { Icon: BarChart2, title: '9-component scoring', body: 'Price behavior, GICS sector, revenue growth, margins, momentum, and more.' },
            { Icon: Shield,    title: 'Point-in-time safe',  body: 'No lookahead bias. Scores are anchored to a stated as-of date.' },
            { Icon: TrendingUp,title: 'Auditable results',   body: 'Every score breaks down into components you can inspect and export.' },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: '#E6FAE6' }}>
                <Icon className="w-4 h-4" style={{ color: 'var(--green-dk)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
