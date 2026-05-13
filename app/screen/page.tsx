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
  const cls = score >= 70 ? 'pill-green' : score >= 45 ? 'pill-gray' : 'pill-red';
  return <span className={cls}>{score.toFixed(0)}</span>;
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
      if (minCap) params.min_market_cap_usd_mm = Number(minCap) * 1000;
      if (maxCap) params.max_market_cap_usd_mm = Number(maxCap) * 1000;
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

  const inputCls = 'w-full px-3 py-2.5 text-sm rounded-lg input-rh';
  const labelCls = 'block text-xs font-medium mb-1.5';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Screener</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Filter by fundamentals, sector, and estimates. Ranked by composite score.
        </p>
      </div>

      <form onSubmit={runScreen} className="card p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)} className={inputCls}>
              {SECTORS.map(s => <option key={s} value={s}>{s || 'All sectors'}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Min Mkt Cap ($B)</label>
            <input type="number" min="0" step="0.1" value={minCap} onChange={e => setMinCap(e.target.value)} placeholder="e.g. 1" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Max Mkt Cap ($B)</label>
            <input type="number" min="0" step="0.1" value={maxCap} onChange={e => setMaxCap(e.target.value)} placeholder="e.g. 500" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Min Score (0–100)</label>
            <input type="number" min="0" max="100" value={minScore} onChange={e => setMinScore(e.target.value)} placeholder="e.g. 50" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Max Short Interest (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={maxSI} onChange={e => setMaxSI(e.target.value)} placeholder="e.g. 10" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Analyst Consensus</label>
            <select value={consensus} onChange={e => setConsensus(e.target.value)} className={inputCls}>
              {CONSENSUS_OPTS.map(c => <option key={c} value={c}>{c || 'Any'}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Min Rev Growth (%)</label>
            <input type="number" step="0.1" value={minRevGrowth} onChange={e => setMinRevGrowth(e.target.value)} placeholder="e.g. 5" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Min Piotroski Score</label>
            <input type="number" min="0" max="9" step="1" value={minPiotroski} onChange={e => setMinPiotroski(e.target.value)} placeholder="e.g. 6" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Max results</label>
            <select value={watchlistSize} onChange={e => setWatchlistSize(e.target.value)} className={inputCls}>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-green px-6 py-2.5 text-sm font-semibold">
            {loading ? 'Screening…' : 'Run screen'}
          </button>
          {error && <span className="text-sm" style={{ color: 'var(--red)' }}>{error}</span>}
        </div>
      </form>

      {results !== null && results.length > 0 && (
        <>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            {total} stocks match · showing {results.length}
          </p>
          <div className="table-rh overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  {['Ticker','Company','Sector','Mkt Cap','Score','Piotroski','EPS Rev','Short Int','Consensus','EBITDA Mgn','Rev Growth'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.ticker}>
                    <td className="px-4 py-3">
                      <a href={`/results/${r.ticker}`} className="font-bold text-sm mono hover:underline"
                        style={{ color: 'var(--text-primary)' }}>
                        {r.ticker}
                      </a>
                    </td>
                    <td className="px-4 py-3 max-w-[160px] truncate text-sm" style={{ color: 'var(--text-secondary)' }}>{r.company_name}</td>
                    <td className="px-4 py-3"><span className="sector-tag">{r.gics_sector ?? '—'}</span></td>
                    <td className="px-4 py-3 text-sm mono" style={{ color: 'var(--text-secondary)' }}>{formatMarketCap(r.market_cap_usd_mm)}</td>
                    <td className="px-4 py-3"><ScoreBadge score={r.screen_score} /></td>
                    <td className="px-4 py-3 text-sm mono text-center" style={{ color: 'var(--text-secondary)' }}>{r.piotroski_f_score ?? '—'}</td>
                    <td className="px-4 py-3 text-sm mono" style={{ color: r.ntm_eps_revision_3m != null ? (r.ntm_eps_revision_3m >= 0 ? 'var(--green-dk)' : 'var(--red)') : 'var(--text-muted)' }}>
                      {r.ntm_eps_revision_3m != null ? `${r.ntm_eps_revision_3m >= 0 ? '+' : ''}${(r.ntm_eps_revision_3m * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm mono" style={{ color: r.short_interest_pct != null && r.short_interest_pct > 0.1 ? 'var(--red)' : 'var(--text-secondary)' }}>
                      {r.short_interest_pct != null ? `${(r.short_interest_pct * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.consensus_label ? (
                        <span className={r.consensus_label === 'Buy' || r.consensus_label === 'Strong Buy' ? 'pill-green' : r.consensus_label === 'Sell' ? 'pill-red' : 'pill-gray'}>
                          {r.consensus_label}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm mono" style={{ color: 'var(--text-secondary)' }}>
                      {r.ebitda_margin != null ? `${(r.ebitda_margin * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm mono" style={{ color: r.revenue_growth_yoy != null ? (r.revenue_growth_yoy >= 0 ? 'var(--green-dk)' : 'var(--red)') : 'var(--text-muted)' }}>
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
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-secondary)' }}>
          No stocks match the current filters. Try relaxing your criteria.
        </div>
      )}
    </div>
  );
}
