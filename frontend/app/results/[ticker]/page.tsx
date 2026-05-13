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
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> New search
        </button>

        {data && (
          <div className="flex-1">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold font-mono text-blue-600">{data.query.ticker}</h1>
              <span className="text-lg text-gray-600 dark:text-gray-400">{data.query.company_name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1 flex-wrap">
              {data.query.gics_sector && <span>{data.query.gics_sector}</span>}
              {data.query.market_cap_usd_mm && <span>{formatMarketCap(data.query.market_cap_usd_mm)}</span>}
              <span>As of {data.query.as_of_date}</span>
              <span className="flex items-center gap-1">
                {data.cached ? '⚡ Cached' : `⏱ ${data.computation_ms}ms`}
              </span>
              <span className="text-xs">{data.total_candidates_evaluated} candidates evaluated</span>
              {data.conviction_enabled && (
                <span className="text-xs bg-purple-900/40 text-purple-400 border border-purple-700 rounded px-1.5 py-0.5">
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
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Download PDF report"
            >
              <FileDown className="w-3.5 h-3.5" /> Report
            </button>
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        )}
      </div>

      {loading && <LoadingState steps={loadingStepObjects} ticker={ticker} />}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="w-6 h-6" />
            <span className="font-medium">Failed to load peers</span>
          </div>
          <p className="text-sm text-gray-500 max-w-md text-center">{error}</p>
          <button
            onClick={load}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Peer Watchlist
                <span className="ml-2 text-sm font-normal text-gray-400">
                  Top {data.watchlist_size} by Research Priority Score
                </span>
              </h2>
            </div>
            <PeerTable
              peers={data.peers}
              convictionEnabled={data.conviction_enabled}
              onSelectForComparison={handleCompareNavigate}
              onRequestThesis={() => setShowThesis(true)}
            />
          </div>

          <div className="mt-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Research use only.</strong> Similarity and Conviction Scores are deterministic algorithms applied to public data.
              Scores do not constitute investment advice. All data sourced from public EDGAR filings and yfinance (dev).
              Methodology v{data.methodology_version} · As of {data.query.as_of_date}
            </p>
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
