'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { searchPeers, formatPct, formatMarketCap, formatMultiple } from '@/lib/api';
import type { PeerRecord, PeerSearchRequest } from '@/lib/types';
import { ComparisonCharts } from '@/components/ComparisonCharts';
import { cn } from '@/lib/utils';

interface MetricRow {
  label: string;
  format: (p: PeerRecord) => string;
  highlight?: 'higher' | 'lower';
}

const METRICS: MetricRow[] = [
  { label: 'Market Cap', format: p => formatMarketCap(p.market_cap_usd_mm) },
  { label: 'Similarity Score', format: p => `${p.similarity_score.toFixed(1)}`, highlight: 'higher' },
  { label: 'Conviction Score', format: p => p.conviction_score != null ? `${p.conviction_score.toFixed(1)}` : '—', highlight: 'higher' },
  { label: 'RPS', format: p => `${p.research_priority_score.toFixed(1)}`, highlight: 'higher' },
  { label: '1M Return', format: p => formatPct(p.price.price_change_1m), highlight: 'higher' },
  { label: '3M Return', format: p => formatPct(p.price.price_change_3m), highlight: 'higher' },
  { label: '6M Return', format: p => formatPct(p.price.price_change_6m), highlight: 'higher' },
  { label: 'Revenue (TTM)', format: p => p.fundamentals.revenue_ttm_mm != null ? formatMarketCap(p.fundamentals.revenue_ttm_mm) : '—' },
  { label: 'Revenue Growth', format: p => formatPct(p.fundamentals.revenue_growth_yoy), highlight: 'higher' },
  { label: 'Gross Margin', format: p => formatPct(p.fundamentals.gross_margin, 1), highlight: 'higher' },
  { label: 'EBITDA Margin', format: p => formatPct(p.fundamentals.ebitda_margin, 1), highlight: 'higher' },
  { label: 'FCF Margin', format: p => formatPct(p.fundamentals.fcf_margin, 1), highlight: 'higher' },
  { label: 'Net Debt/EBITDA', format: p => p.fundamentals.net_debt_ebitda != null ? `${p.fundamentals.net_debt_ebitda.toFixed(1)}x` : '—', highlight: 'lower' },
  { label: 'Piotroski F-Score', format: p => p.fundamentals.piotroski_f_score != null ? `${p.fundamentals.piotroski_f_score}/9` : '—', highlight: 'higher' },
  { label: 'NTM EPS Est.', format: p => p.estimates?.ntm_eps_consensus != null ? `$${p.estimates.ntm_eps_consensus.toFixed(2)}` : '—' },
  { label: 'EPS Revision 3M', format: p => formatPct(p.estimates?.ntm_eps_revision_3m ?? null), highlight: 'higher' },
  { label: 'EV/NTM EBITDA', format: p => formatMultiple(p.estimates?.ev_ntm_ebitda ?? null), highlight: 'lower' },
  { label: 'Short Interest', format: p => formatPct(p.estimates?.short_interest_pct ?? null, 1), highlight: 'lower' },
  { label: 'Analyst Rating', format: p => p.estimates?.consensus_label ?? '—' },
  { label: 'Analyst Count', format: p => p.estimates?.analyst_count != null ? String(p.estimates.analyst_count) : '—' },
];

function _numericValue(p: PeerRecord, metric: MetricRow): number | null {
  const str = metric.format(p);
  if (str === '—' || str === '') return null;
  const n = parseFloat(str.replace(/[+%$,xBTM]/g, ''));
  return isNaN(n) ? null : n;
}

function CellColor({ value, allValues, highlight }: {
  value: string;
  allValues: number[];
  highlight?: 'higher' | 'lower';
}) {
  if (!highlight || value === '—') {
    return <span className="font-mono text-sm text-gray-300">{value}</span>;
  }
  const n = parseFloat(value.replace(/[+%$,xBTM]/g, ''));
  if (isNaN(n) || allValues.length < 2) {
    return <span className="font-mono text-sm text-gray-300">{value}</span>;
  }
  const best = highlight === 'higher' ? Math.max(...allValues) : Math.min(...allValues);
  const worst = highlight === 'higher' ? Math.min(...allValues) : Math.max(...allValues);
  const isBest = Math.abs(n - best) < 0.001;
  const isWorst = Math.abs(n - worst) < 0.001 && allValues.length > 1;
  return (
    <span className={cn(
      'font-mono text-sm font-medium',
      isBest && 'text-emerald-400',
      isWorst && !isBest && 'text-red-400',
      !isBest && !isWorst && 'text-gray-300',
    )}>
      {value}
    </span>
  );
}

function CompareInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryTicker = (searchParams.get('query') ?? '').toUpperCase();
  const peerTickersRaw = searchParams.get('peers') ?? '';
  const peerTickers = peerTickersRaw.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);

  const [peers, setPeers] = useState<PeerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const peerKey = peerTickers.join(',');

  const load = useCallback(async () => {
    if (!queryTicker || peerTickers.length === 0) {
      setError('Missing query or peers in URL. Use ?query=AAPL&peers=MSFT,GOOG');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const req: PeerSearchRequest = {
        ticker: queryTicker,
        watchlist_size: 50,
        region: 'US',
        use_transcripts: false,
        use_analyst_estimates: true,
        use_legacy_score: false,
        as_of_date: null,
        sector_lock: false,
        min_market_cap_usd: null,
        max_market_cap_usd: null,
        exclude_tickers: [],
        generate_thesis: false,
      };
      const result = await searchPeers(req);
      const matched = result.peers.filter(p => peerTickers.includes(p.ticker));
      if (matched.length === 0) {
        setError(`None of the requested tickers (${peerTickers.join(', ')}) appeared in the peer results for ${queryTicker}.`);
      } else {
        matched.sort((a, b) => peerTickers.indexOf(a.ticker) - peerTickers.indexOf(b.ticker));
        setPeers(matched);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [queryTicker, peerKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  if (!queryTicker) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-gray-400">Use <code className="text-blue-400">/compare?query=AAPL&peers=MSFT,GOOG</code></p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">
            Peer Comparison: <span className="font-mono text-blue-400">{queryTicker}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Comparing {peerTickers.join(' · ')}</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-20 justify-center text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" />
          <span>Loading comparison data…</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={() => router.push('/')} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            New search
          </button>
        </div>
      )}

      {!loading && peers.length > 0 && (
        <div className="space-y-8">
          <div className="rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 w-40">Metric</th>
                    {peers.map(p => (
                      <th key={p.ticker} className="px-4 py-3 text-center min-w-32">
                        <div className="font-mono font-bold text-blue-400">{p.ticker}</div>
                        <div className="text-xs text-gray-500 font-normal truncate max-w-32">{p.company_name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {METRICS.map((metric, mi) => {
                    const values = peers.map(p => _numericValue(p, metric)).filter((v): v is number => v !== null);
                    const isGroupDivider = [0, 4, 7, 13, 14, 18].includes(mi);
                    return (
                      <tr
                        key={metric.label}
                        className={cn(
                          'hover:bg-gray-800/50',
                          isGroupDivider && mi > 0 && 'border-t border-gray-600',
                          mi % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50',
                        )}
                      >
                        <td className="px-4 py-2.5 text-xs text-gray-500 font-medium">{metric.label}</td>
                        {peers.map(p => (
                          <td key={p.ticker} className="px-4 py-2.5 text-center">
                            <CellColor value={metric.format(p)} allValues={values} highlight={metric.highlight} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Best in group</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Worst in group</span>
          </div>

          {peers.length >= 2 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-200 mb-4">Charts</h2>
              <ComparisonCharts peers={peers} queryTicker={queryTicker} />
            </div>
          )}

          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/40">
            <p className="text-xs text-amber-400/80">
              Research use only. Scores are algorithmic outputs from public data and do not constitute investment advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-3 py-20 justify-center text-gray-400">
        <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" />
        <span>Loading…</span>
      </div>
    }>
      <CompareInner />
    </Suspense>
  );
}
