'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertCircle, FileDown } from 'lucide-react';
import { searchPeers, downloadReport, buildCompareUrl } from '@/lib/api';
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
  const [currentRequest, setCurrentRequest] = useState<PeerSearchRequest | null>(null);

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
      setCurrentRequest(req);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header bar */}
      <div className="flex items-start gap-4 mb-8 flex-wrap">
        <button
          onClick={() => router.push('/')}
          className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg mt-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> New search
        </button>

        {data && (
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-3xl font-bold font-mono" style={{ color: '#22d3ee', textShadow: '0 0 20px rgba(34,211,238,0.4)', letterSpacing: '0.04em' }}>
                {data.query.ticker}
              </h1>
              <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>{data.query.company_name}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {data.query.gics_sector && (
                <span className="sector-tag">{data.query.gics_sector}</span>
              )}
              {data.query.market_cap_usd_mm && (
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatMarketCap(data.query.market_cap_usd_mm)}
                </span>
              )}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>As of {data.query.as_of_date}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {data.cached ? '⚡ cached' : `⏱ ${data.computation_ms}ms`}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{data.total_candidates_evaluated} candidates</span>
              {data.conviction_enabled && (
                <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(167,139,250,0.12)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.25)' }}>
                  Conviction v2
                </span>
              )}
            </div>
          </div>
        )}

        {data && (
          <div className="flex items-center gap-2 flex-wrap">
            <WatchlistButton queryTicker={ticker.toUpperCase()} peers={data.peers} />
            <button
              onClick={() => downloadReport(ticker.toUpperCase(), watchlistSize)}
              className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            >
              <FileDown className="w-3.5 h-3.5" /> Report
            </button>
            <button
              onClick={load}
              className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        )}
      </div>

      {loading && <LoadingState steps={loadingStepObjects} ticker={ticker} />}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
            <AlertCircle className="w-6 h-6" style={{ color: '#f87171' }} />
          </div>
          <div className="text-center">
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Failed to load peers</p>
            <p className="text-xs mt-1 max-w-md" style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
          <button onClick={load} className="btn-primary px-5 py-2 rounded-lg text-sm font-medium">
            Try again
          </button>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Peer Watchlist
              </h2>
              <span className="text-xs px-2 py-0.5 rounded"
                style={{ background: 'rgba(34,211,238,0.08)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.15)' }}>
                Top {data.watchlist_size} by RPS
              </span>
            </div>
            <PeerTable
              peers={data.peers}
              convictionEnabled={data.conviction_enabled}
              onSelectForComparison={handleCompareNavigate}
              onRequestThesis={() => setShowThesis(true)}
            />
          </div>

          <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: '#94a3b8' }}>
            <strong style={{ color: '#fbbf24' }}>Research use only.</strong> Scores are deterministic algorithms on public data and do not constitute investment advice.
            Methodology v{data.methodology_version} · As of {data.query.as_of_date}
          </div>
        </div>
      )}

      {showThesis && data && currentRequest && (
        <ThesisPanel
          queryTicker={ticker.toUpperCase()}
          peers={data.peers}
          request={currentRequest}
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
