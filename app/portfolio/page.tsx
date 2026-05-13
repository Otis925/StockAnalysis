'use client';

import { useState } from 'react';
import { analyzePortfolio, formatMarketCap, ApiError } from '@/lib/api';
import type { OverlapPeer } from '@/lib/types';

function OverlapBar({ score }: { score: number }) {
  const pct = Math.min(100, score);
  const color = pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-8">{pct.toFixed(0)}</span>
    </div>
  );
}

export default function PortfolioPage() {
  const [input, setInput] = useState('');
  const [watchlistSize, setWatchlistSize] = useState(10);
  const [results, setResults] = useState<OverlapPeer[] | null>(null);
  const [portfolioTickers, setPortfolioTickers] = useState<string[]>([]);
  const [computationMs, setComputationMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  async function runAnalysis(e: React.FormEvent) {
    e.preventDefault();
    const tickers = input.toUpperCase().split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
    if (tickers.length < 1) { setError('Enter at least 1 ticker'); return; }
    if (tickers.length > 20) { setError('Maximum 20 tickers'); return; }
    setError(null);
    setLoading(true);
    try {
      const resp = await analyzePortfolio(tickers, watchlistSize, true);
      setResults(resp.overlap_peers);
      setPortfolioTickers(resp.query_tickers);
      setComputationMs(resp.computation_ms);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Overlap</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Find stocks that are peers across multiple holdings. High overlap score = strong cross-portfolio similarity.
        </p>
      </div>

      <form onSubmit={runAnalysis} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Portfolio tickers (comma or space separated, max 20)
            </label>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. AAPL MSFT GOOG AMZN META"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div className="sm:w-40">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Overlap candidates</label>
            <select
              value={watchlistSize}
              onChange={e => setWatchlistSize(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>Top 10</option>
              <option value={25}>Top 25</option>
              <option value={50}>Top 50</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
            {loading ? 'Analyzing…' : 'Find overlap'}
          </button>
          {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
        </div>
      </form>

      {results !== null && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              {portfolioTickers.map(t => (
                <span key={t} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold rounded">
                  {t}
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-auto">{computationMs}ms</span>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No overlap candidates found. Try a larger candidate pool.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-3">Ticker</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Sector</th>
                    <th className="px-4 py-3 text-right">Mkt Cap</th>
                    <th className="px-4 py-3">Overlap Score</th>
                    <th className="px-4 py-3 text-center">Appears in</th>
                    <th className="px-4 py-3 text-right">Avg RPS</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {results.map((r, i) => (
                    <>
                      <tr
                        key={r.ticker}
                        className={`${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'} hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors cursor-pointer`}
                        onClick={() => setExpandedTicker(expandedTicker === r.ticker ? null : r.ticker)}
                      >
                        <td className="px-4 py-3">
                          <a
                            href={`/results/${r.ticker}`}
                            className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            {r.ticker}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[160px] truncate">{r.company_name}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{r.gics_sector ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatMarketCap(r.market_cap_usd_mm)}</td>
                        <td className="px-4 py-3"><OverlapBar score={r.overlap_score} /></td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-gray-900 dark:text-white">{r.appears_in}</span>
                          <span className="text-gray-400">/{r.n_queries}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                          {r.avg_rps.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {expandedTicker === r.ticker ? '▲' : '▼'}
                        </td>
                      </tr>
                      {expandedTicker === r.ticker && (
                        <tr key={`${r.ticker}-detail`} className="bg-blue-50/60 dark:bg-blue-900/10">
                          <td colSpan={8} className="px-6 py-3">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">RPS by holding</div>
                            <div className="flex flex-wrap gap-3">
                              {Object.entries(r.per_holding_rps).map(([holding, rps]) => (
                                <div key={holding} className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-gray-700 dark:text-gray-300 text-xs">{holding}</span>
                                  <span className="text-xs text-gray-500">→</span>
                                  <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs">{rps.toFixed(1)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
