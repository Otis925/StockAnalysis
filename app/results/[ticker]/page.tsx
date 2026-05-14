'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertCircle, FileDown } from 'lucide-react';
import { searchPeers, buildCompareUrl } from '@/lib/api';
import { generateReport } from '@/lib/report';
import type { PeerSearchResponse, PeerSearchRequest } from '@/lib/types';
import { PeerTable } from '@/components/PeerTable';
import { LoadingState } from '@/components/LoadingState';
import { ThesisPanel } from '@/components/ThesisPanel';
import WatchlistButton from '@/components/WatchlistButton';
import { formatMarketCap } from '@/lib/api';

const LOADING_STEPS = [
  'Fetching price history',
  'Computing similarity scores',
  'Loading fundamentals',
  'Scoring conviction',
  'Ranking peers',
];

interface Props {
  params: Promise<{ ticker: string }>;
}

function ResultsInner({ ticker }: { ticker: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const watchlistSize = (Number(searchParams.get('watchlist_size') ?? 25)) as 10 | 25 | 50;
  const sectorLock = searchParams.get('sector_lock') === 'true';
  const minCap = searchParams.get('min_cap') ? Number(searchParams.get('min_cap')) : null;
  const maxCap = searchParams.get('max_cap') ? Number(searchParams.get('max_cap')) : null;

  const [data, setData] = useState<PeerSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const [showThesis, setShowThesis] = useState(false);

  const handleCompareNavigate = (tickers: string[]) => {
    const url = buildCompareUrl(ticker.toUpperCase(), tickers);
    router.push(url);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setStepIdx(0);
    setShowThesis(false);

    const stepInterval = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 600);

    try {
      const req: PeerSearchRequest = {
        ticker: ticker.toUpperCase(),
        watchlist_size: [10, 25, 50].includes(watchlistSize) ? watchlistSize : 25,
        region: 'US',
        use_transcripts: false,
        use_analyst_estimates: true,
        use_legacy_score: false,
        as_of_date: null,
        sector_lock: sectorLock,
        min_market_cap_usd: minCap,
        max_market_cap_usd: maxCap,
        exclude_tickers: [],
        generate_thesis: false,
      };
      const result = await searchPeers(req);
      clearInterval(stepInterval);
      setStepIdx(LOADING_STEPS.length);
      setData(result);
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [ticker, watchlistSize, sectorLock, minCap, maxCap]);

  useEffect(() => { load(); }, [load]);

  const loadingStepObjects = LOADING_STEPS.map((label, i) => ({
    label,
    status: i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending',
  } as const));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button onClick={() => router.push('/')}
        className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to search
      </button>

      {/* Stock header */}
      {data && (
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <h1 className="text-4xl font-bold mono" style={{ color: 'var(--text-primary)' }}>
                {data.query.ticker}
              </h1>
              <span className="text-xl" style={{ color: 'var(--text-secondary)' }}>
                {data.query.company_name}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {data.query.gics_sector && <span className="sector-tag">{data.query.gics_sector}</span>}
              {data.query.market_cap_usd_mm && (
                <span className="text-sm mono" style={{ color: 'var(--text-muted)' }}>
                  {formatMarketCap(data.query.market_cap_usd_mm)}
                </span>
              )}
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>As of {data.query.as_of_date}</span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{data.total_candidates_evaluated} candidates</span>
              {data.conviction_enabled && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: '#F5F0FF', color: '#6B21A8' }}>Conviction v2</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <WatchlistButton queryTicker={ticker.toUpperCase()} peers={data.peers} />
            <button onClick={() => data && generateReport(data)}
              className="btn-ghost flex items-center gap-1.5 text-sm px-4 py-2">
              <FileDown className="w-4 h-4" /> Report
            </button>
            <button onClick={load}
              className="btn-ghost flex items-center gap-1.5 text-sm px-4 py-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      )}

      {loading && <LoadingState steps={loadingStepObjects} ticker={ticker} />}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: '#FFF0EB' }}>
            <AlertCircle className="w-6 h-6" style={{ color: 'var(--red)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Could not load peers</p>
            <p className="text-sm mt-1 max-w-md" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          </div>
          <button onClick={load} className="btn-green px-6 py-2.5 text-sm font-semibold">
            Try again
          </button>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Peer Watchlist</h2>
              <span className="pill-green">Top {data.watchlist_size} by RPS</span>
            </div>
            <PeerTable
              peers={data.peers}
              convictionEnabled={data.conviction_enabled}
              onSelectForComparison={handleCompareNavigate}
              onRequestThesis={() => setShowThesis(true)}
            />
          </div>

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            For research only. Scores are algorithmic outputs on public data and do not constitute investment advice.
            Methodology v{data.methodology_version} · As of {data.query.as_of_date}
          </p>
        </div>
      )}

      {showThesis && data && (
        <ThesisPanel
          queryTicker={ticker.toUpperCase()}
          peers={data.peers}
          onClose={() => setShowThesis(false)}
        />
      )}
    </div>
  );
}

export default async function ResultsPage({ params }: Props) {
  const { ticker } = await params;
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 py-20 justify-center text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    }>
      <ResultsInner ticker={ticker} />
    </Suspense>
  );
}
