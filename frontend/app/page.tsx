'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, Target, TrendingUp } from 'lucide-react';
import { TickerInput } from '@/components/TickerInput';
import type { TickerSuggestion } from '@/lib/types';

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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
          Find stocks that behave like yours.
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Enter one ticker. Get ranked peers scored on price behavior, sector, and financials.
          Deterministic. Auditable. Point-in-time.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
        <div className="flex gap-3">
          <TickerInput
            value={ticker}
            onChange={setTicker}
            className="flex-1"
            autoFocus
          />
          <button
            type="submit"
            disabled={!ticker.trim()}
            className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Analyze <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {error && <p className="text-sm text-red-500 px-1">{error}</p>}

        {/* Advanced options toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showAdvanced ? '▲' : '▼'} Advanced options
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Watchlist size</label>
                  <div className="flex gap-2">
                    {([10, 25, 50] as const).map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setWatchlistSize(n)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          watchlistSize === n
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Market cap (USD M)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minCap}
                      onChange={e => setMinCap(e.target.value)}
                      className="w-24 px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxCap}
                      onChange={e => setMaxCap(e.target.value)}
                      className="w-24 px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sectorLock}
                    onChange={e => setSectorLock(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sector lock</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Feature chips */}
      <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          9-component similarity score
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-500" />
          Point-in-time safe
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          EDGAR fundamentals
        </div>
      </div>
    </div>
  );
}
