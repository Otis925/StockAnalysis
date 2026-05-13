'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, Sparkles } from 'lucide-react';
import type { PeerRecord, SortKey, SortDir } from '@/lib/types';
import { ScoreBar } from './ScoreBar';
import { ScoreDetailTooltip, SimpleTooltip } from './ScoreTooltip';
import { formatPct, formatMarketCap } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PeerTableProps {
  peers: PeerRecord[];
  convictionEnabled?: boolean;
  onSelectForComparison?: (tickers: string[]) => void;
  onRequestThesis?: () => void;
}

const SCORE_TOOLTIPS = {
  similarity_score: 'Similarity Score: measures how closely this stock\'s price behavior, sector, and financials match the query. 100 = identical profile.',
  research_priority_score: 'Research Priority Score: default sort key. 50% Similarity + 30% Conviction + 20% analyst coverage. Identifies highest-value research candidates.',
  conviction_score: 'Conviction Score: peer-relative percentile ranking of EPS revision momentum, price momentum, valuation discount, short interest, analyst consensus, and Piotroski F-Score.',
};

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 text-gray-300" />;
  return sortDir === 'desc'
    ? <ChevronDown className="w-3 h-3 text-blue-500" />
    : <ChevronUp className="w-3 h-3 text-blue-500" />;
}

function ConvictionScore({ score }: { score: number | null }) {
  if (score == null) return <span className="text-gray-500 font-mono text-xs">—</span>;
  const color =
    score >= 70 ? 'text-emerald-400' :
    score >= 45 ? 'text-amber-400' :
                  'text-red-400';
  return (
    <div className="flex items-center gap-1 min-w-24">
      <span className={cn('font-mono text-xs font-semibold w-8 text-right', color)}>
        {score.toFixed(0)}
      </span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            score >= 70 ? 'bg-emerald-500' : score >= 45 ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function PeerTable({ peers, convictionEnabled, onSelectForComparison, onRequestThesis }: PeerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('research_priority_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sectorFilter, setSectorFilter] = useState('');
  const [minScore, setMinScore] = useState(0);

  const sectors = useMemo(() => {
    const s = new Set(peers.map(p => p.gics_sector).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [peers]);

  const sorted = useMemo(() => {
    let filtered = [...peers];
    if (sectorFilter) filtered = filtered.filter(p => p.gics_sector === sectorFilter);
    if (minScore > 0) filtered = filtered.filter(p => p.similarity_score >= minScore);

    filtered.sort((a, b) => {
      let va: number | string | null;
      let vb: number | string | null;
      if (sortKey === 'conviction_score') {
        va = a.conviction_score ?? -1;
        vb = b.conviction_score ?? -1;
      } else {
        va = a[sortKey as keyof PeerRecord] as number | string ?? 0;
        vb = b[sortKey as keyof PeerRecord] as number | string ?? 0;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return filtered;
  }, [peers, sortKey, sortDir, sectorFilter, minScore]);

  const toggleSort = (col: SortKey) => {
    if (col === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(col); setSortDir('desc'); }
  };

  const toggleSelect = (ticker: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else if (next.size < 5) next.add(ticker);
      return next;
    });
  };

  const exportCsv = () => {
    const header = convictionEnabled
      ? 'Ticker,Company,Sector,Sim Score,Conviction,RPS,Market Cap,3M Return,EPS Revision,Short Interest,Consensus\n'
      : 'Ticker,Company,Sector,Sim Score,RPS,Market Cap,3M Return,Rev Growth,EBITDA Margin\n';

    const rows = sorted.map(p => {
      if (convictionEnabled) {
        return [
          p.ticker,
          `"${p.company_name}"`,
          p.gics_sector ?? '',
          p.similarity_score.toFixed(1),
          p.conviction_score?.toFixed(1) ?? '',
          p.research_priority_score.toFixed(1),
          p.market_cap_usd_mm?.toFixed(0) ?? '',
          p.price.price_change_3m != null ? (p.price.price_change_3m * 100).toFixed(1) + '%' : '',
          p.estimates?.ntm_eps_revision_3m != null ? (p.estimates.ntm_eps_revision_3m * 100).toFixed(1) + '%' : '',
          p.estimates?.short_interest_pct != null ? (p.estimates.short_interest_pct * 100).toFixed(1) + '%' : '',
          p.estimates?.consensus_label ?? '',
        ].join(',');
      }
      return [
        p.ticker,
        `"${p.company_name}"`,
        p.gics_sector ?? '',
        p.similarity_score.toFixed(1),
        p.research_priority_score.toFixed(1),
        p.market_cap_usd_mm?.toFixed(0) ?? '',
        p.price.price_change_3m != null ? (p.price.price_change_3m * 100).toFixed(1) + '%' : '',
        p.fundamentals.revenue_growth_yoy != null ? (p.fundamentals.revenue_growth_yoy * 100).toFixed(1) + '%' : '',
        p.fundamentals.ebitda_margin != null ? (p.fundamentals.ebitda_margin * 100).toFixed(1) + '%' : '',
      ].join(',');
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ColHeader = ({ col, label, tooltip }: { col: SortKey; label: string; tooltip?: string }) => (
    <th className="px-3 py-3 text-left">
      <div className="flex items-center gap-1">
        <button
          onClick={() => toggleSort(col)}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          {label}
          <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
        </button>
        {tooltip && (
          <SimpleTooltip content={tooltip}>
            <span className="text-gray-300 cursor-help text-xs">ⓘ</span>
          </SimpleTooltip>
        )}
      </div>
    </th>
  );

  const colSpan = convictionEnabled ? 11 : 10;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sectorFilter}
          onChange={e => setSectorFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 dark:border-gray-700"
        >
          <option value="">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={minScore}
          onChange={e => setMinScore(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 dark:border-gray-700"
        >
          <option value={0}>Sim ≥ 0</option>
          <option value={25}>Sim ≥ 25</option>
          <option value={50}>Sim ≥ 50</option>
          <option value={75}>Sim ≥ 75</option>
        </select>

        <span className="text-sm text-gray-400 ml-auto">
          {sorted.length} peer{sorted.length !== 1 ? 's' : ''}
        </span>

        {selected.size >= 2 && (
          <button
            onClick={() => onSelectForComparison?.(Array.from(selected))}
            className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Compare {selected.size} selected
          </button>
        )}

        {onRequestThesis && (
          <button
            onClick={onRequestThesis}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Thesis
          </button>
        )}

        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="w-10 px-3 py-3">
                  <span className="sr-only">Select</span>
                </th>
                <ColHeader col="ticker" label="Ticker" />
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">Company</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">Sector</th>
                <ColHeader col="similarity_score" label="Sim" tooltip={SCORE_TOOLTIPS.similarity_score} />
                {convictionEnabled && (
                  <ColHeader col="conviction_score" label="Conv" tooltip={SCORE_TOOLTIPS.conviction_score} />
                )}
                <ColHeader col="research_priority_score" label="RPS" tooltip={SCORE_TOOLTIPS.research_priority_score} />
                <ColHeader col="market_cap_usd_mm" label="Mkt Cap" />
                {convictionEnabled ? (
                  <>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">EPS Rev</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">SI%</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">Rating</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">3M Ret</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">Rev Growth</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">EBITDA Mgn</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="text-center py-12 text-gray-400">
                    No peers match the current filters.
                  </td>
                </tr>
              ) : (
                sorted.map((peer) => (
                  <tr
                    key={peer.ticker}
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                      selected.has(peer.ticker) && 'bg-blue-50 dark:bg-blue-900/20',
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(peer.ticker)}
                        onChange={() => toggleSelect(peer.ticker)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{peer.ticker}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-300 max-w-40 truncate">
                      {peer.company_name}
                    </td>
                    <td className="px-3 py-3 text-gray-500 max-w-32 truncate text-xs">
                      {peer.gics_sub_industry ?? peer.gics_sector ?? '—'}
                    </td>
                    <td className="px-3 py-3 min-w-32">
                      <div className="flex items-center gap-1">
                        <ScoreBar score={peer.similarity_score} className="flex-1" size="sm" />
                        <ScoreDetailTooltip
                          components={peer.score_components}
                          totalScore={peer.similarity_score}
                          flags={peer.score_metadata.flags}
                        />
                      </div>
                    </td>
                    {convictionEnabled && (
                      <td className="px-3 py-3">
                        <ConvictionScore score={peer.conviction_score} />
                      </td>
                    )}
                    <td className="px-3 py-3 min-w-28">
                      <ScoreBar score={peer.research_priority_score} size="sm" />
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {formatMarketCap(peer.market_cap_usd_mm)}
                    </td>
                    {convictionEnabled ? (
                      <>
                        <td className={cn('px-3 py-3 font-mono text-xs', (peer.estimates?.ntm_eps_revision_3m ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-400')}>
                          {peer.estimates?.ntm_eps_revision_3m != null
                            ? formatPct(peer.estimates.ntm_eps_revision_3m)
                            : '—'}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-gray-400">
                          {peer.estimates?.short_interest_pct != null
                            ? formatPct(peer.estimates.short_interest_pct, 1).replace('+', '')
                            : '—'}
                        </td>
                        <td className="px-3 py-3">
                          {peer.estimates?.consensus_label ? (
                            <span className={cn(
                              'text-xs font-medium px-1.5 py-0.5 rounded',
                              peer.estimates.consensus_label === 'Buy' ? 'bg-emerald-900/40 text-emerald-400' :
                              peer.estimates.consensus_label === 'Sell' ? 'bg-red-900/40 text-red-400' :
                              'bg-gray-800 text-gray-400'
                            )}>
                              {peer.estimates.consensus_label}
                            </span>
                          ) : <span className="text-gray-500 text-xs">—</span>}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={cn('px-3 py-3 font-mono text-xs', (peer.price.price_change_3m ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                          {formatPct(peer.price.price_change_3m)}
                        </td>
                        <td className={cn('px-3 py-3 font-mono text-xs', (peer.fundamentals.revenue_growth_yoy ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                          {formatPct(peer.fundamentals.revenue_growth_yoy)}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                          {formatPct(peer.fundamentals.ebitda_margin, 1)}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
