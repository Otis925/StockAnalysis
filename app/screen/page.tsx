'use client';

import { useState } from 'react';
import { screenStocks, formatMarketCap, ApiError } from '@/lib/api';
import type { ScreenRecord } from '@/lib/types';

const SECTORS = [
  '', 'Information Technology', 'Health Care', 'Financials', 'Consumer Discretionary',
  'Communication Services', 'Industrials', 'Consumer Staples', 'Energy', 'Utilities',
  'Real Estate', 'Materials',
];

const CONSENSUS_OPTS = ['', 'Strong Buy', 'Buy', 'Hold', 'Sell'];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    : score >= 45 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{score.toFixed(0)}</span>;
}

export default function ScreenPage() {
  const [sector, setSector] = useState('');
  const [minCap, setMinCap] = useState('');
  const [maxCap, setMaxCap] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxSI, setMaxSI] = useState('');
  const [consensus, setConsensus] = useState('');
  const [minRevGrowth, setMinRevGrowth] = useState('');
  const [minPiotroski, setMinPiotroski] = useState('');
  const [watchlistSize, setWatchlistSize] = useState('50');

  const [results, setResults] = useState<ScreenRecord[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScreen(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (sector) params.sector = sector;
      if (minCap) params.min_market_cap_usd = Number(minCap) * 1e6;
      if (maxCap) params.max_market_cap_usd = Number(maxCap) * 1e6;
      if (minScore) params.min_screen_score = Number(minScore);
      if (maxSI) params.max_short_interest = Number(maxSI) / 100;
      if (consensus) params.consensus = consensus;
      if (minRevGrowth) params.min_rev_growth = Number(minRevGrowth) / 100;
      if (minPiotroski) params.min_piotroski = Number(minPiotroski);
      params.watchlist_size = Number(watchlistSize);

      const resp = await screenStocks(params);
      setResults(resp.results);
      setTotal(resp.total_matched);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Screen failed');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Screener</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Filter by fundamentals, estimates, and sector. Ranked by composite screen score.
        </p>
      </div>

      <form onSubmit={runScreen} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <label className={labelCls}>Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)} className={inputCls}>
              {SECTORS.map(s => <option key={s} value={s}>{s || 'All sectors'}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Min Market Cap ($B)</label>
            <input type="number" min="0" step="0.1" value={minCap} onChange={e => setMinCap(e.target.value)} placeholder="e.g. 1" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Max Market Cap ($B)</label>
            <input type="number" min="0" step="0.1" value={maxCap} onChange={e => setMaxCap(e.target.value)} placeholder="e.g. 500" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Min Screen Score (0–100)</label>
            <input type="number" min="0" max="100" value={minScore} onChange={e => setMinScore(e.target.value)} placeholder="e.g. 50" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Max Short Interest (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={maxSI} onChange={e => setMaxSI(e.target.value)} placeholder="e.g. 10" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Analyst Consensus</label>
            <select value={consensus} onChange={e => setConsensus(e.target.value)} className={inputCls}>
              {CONSENSUS_OPTS.map(c => <option key={c} value={c}>{c || 'Any'}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Min Revenue Growth (%)</label>
            <input type="number" step="0.1" value={minRevGrowth} onChange={e => setMinRevGrowth(e.target.value)} placeholder="e.g. 5" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Min Piotroski F-Score</label>
            <input type="number" min="0" max="9" step="1" value={minPiotroski} onChange={e => setMinPiotroski(e.target.value)} placeholder="e.g. 6" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Max results</label>
            <select value={watchlistSize} onChange={e => setWatchlistSize(e.target.value)} className={inputCls}>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
            {loading ? 'Screening…' : 'Run screen'}
          </button>
          {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
        </div>
      </form>

      {results !== null && (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {total} stocks match · showing {results.length}
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3">Ticker</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3 text-right">Mkt Cap</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-right">Piotroski</th>
                  <th className="px-4 py-3 text-right">EPS Rev 3M</th>
                  <th className="px-4 py-3 text-right">Short Int</th>
                  <th className="px-4 py-3 text-center">Consensus</th>
                  <th className="px-4 py-3 text-right">EBITDA Mgn</th>
                  <th className="px-4 py-3 text-right">Rev Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {results.map((r, i) => (
                  <tr key={r.ticker} className={`${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'} hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors`}>
                    <td className="px-4 py-3">
                      <a href={`/results/${r.ticker}`} className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        {r.ticker}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[180px] truncate">{r.company_name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{r.gics_sector ?? r.gics_sub_industry ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatMarketCap(r.market_cap_usd_mm)}</td>
                    <td className="px-4 py-3 text-center"><ScoreBadge score={r.screen_score} /></td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{r.piotroski_f_score ?? '—'}</td>
                    <td className={`px-4 py-3 text-right ${r.ntm_eps_revision_3m != null ? (r.ntm_eps_revision_3m >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-500'}`}>
                      {r.ntm_eps_revision_3m != null ? `${r.ntm_eps_revision_3m >= 0 ? '+' : ''}${(r.ntm_eps_revision_3m * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right ${r.short_interest_pct != null && r.short_interest_pct > 0.1 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {r.short_interest_pct != null ? `${(r.short_interest_pct * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{r.consensus_label ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {r.ebitda_margin != null ? `${(r.ebitda_margin * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right ${r.revenue_growth_yoy != null ? (r.revenue_growth_yoy >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-500'}`}>
                      {r.revenue_growth_yoy != null ? `${r.revenue_growth_yoy >= 0 ? '+' : ''}${(r.revenue_growth_yoy * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {results?.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No stocks match the current filters. Try relaxing your criteria.
        </div>
      )}
    </div>
  );
}
