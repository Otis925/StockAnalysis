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
  research_priority_score: 'Research Priority Score (RPS): 50% Similarity + 30% Conviction + 20% analyst coverage. Default sort.',
  conviction_score: 'Conviction Score: peer-relative percentile ranking of EPS revision momentum, price momentum, valuation discount, short interest, consensus, and Piotroski F-Score.',
};

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />;
  return sortDir === 'desc'
    ? <ChevronDown className="w-3 h-3" style={{ color: 'var(--green-dk)' }} />
    : <ChevronUp className="w-3 h-3" style={{ color: 'var(--green-dk)' }} />;
}

function ConvictionBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs mono" style={{ color: 'var(--text-muted)' }}>—</span>;
  const color = score >= 70 ? 'var(--green)' : score >= 45 ? '#F59E0B' : 'var(--red)';
  return (
    <div className="flex items-center gap-1.5 min-w-[88px]">
      <span className="text-xs font-semibold w-7 text-right mono" style={{ color }}>{score.toFixed(0)}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#EBEBEB' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function ConsensusBadge({ label }: { label: string }) {
  const map: Record<string, string> = {
    'Strong Buy': 'pill-green',
    'Buy': 'pill-green',
    'Hold': 'pill-gray',
    'Sell': 'pill-red',
  };
  return <span className={map[label] ?? 'pill-gray'}>{label}</span>;
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
      let va: number | string;
      let vb: number | string;
      if (sortKey === 'conviction_score') {
        va = a.conviction_score ?? -1;
        vb = b.conviction_score ?? -1;
      } else {
        va = (a[sortKey as keyof PeerRecord] as number | string) ?? 0;
        vb = (b[sortKey as keyof PeerRecord] as number | string) ?? 0;
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
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
      if (next.has(ticker)) next.delete(ticker); else if (next.size < 5) next.add(ticker);
      return next;
    });
  };

  const exportCsv = () => {
    const header = 'Ticker,Company,Sector,Sim,RPS,Mkt Cap,3M Return,Rev Growth,EBITDA Margin\n';
    const rows = sorted.map(p => [
      p.ticker, `"${p.company_name}"`, p.gics_sector ?? '', p.similarity_score.toFixed(1),
      p.research_priority_score.toFixed(1), p.market_cap_usd_mm?.toFixed(0) ?? '',
      p.price.price_change_3m != null ? (p.price.price_change_3m * 100).toFixed(1) + '%' : '',
      p.fundamentals.revenue_growth_yoy != null ? (p.fundamentals.revenue_growth_yoy * 100).toFixed(1) + '%' : '',
      p.fundamentals.ebitda_margin != null ? (p.fundamentals.ebitda_margin * 100).toFixed(1) + '%' : '',
    ].join(',')).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `peers_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const selectStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '8px',
    outline: 'none',
  };

  const ColHeader = ({ col, label, tooltip }: { col: SortKey; label: string; tooltip?: string }) => (
    <th className="px-3 py-3 text-left">
      <div className="flex items-center gap-1">
        <button onClick={() => toggleSort(col)}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors"
          style={{ color: sortKey === col ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {label} <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
        </button>
        {tooltip && (
          <SimpleTooltip content={tooltip}>
            <span className="cursor-help text-xs" style={{ color: 'var(--text-muted)' }}>ⓘ</span>
          </SimpleTooltip>
        )}
      </div>
    </th>
  );

  const colSpan = convictionEnabled ? 11 : 10;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={selectStyle}>
          <option value="">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={minScore} onChange={e => setMinScore(Number(e.target.value))} style={selectStyle}>
          <option value={0}>Sim ≥ 0</option>
          <option value={25}>Sim ≥ 25</option>
          <option value={50}>Sim ≥ 50</option>
          <option value={75}>Sim ≥ 75</option>
        </select>

        <span className="text-xs mono ml-auto" style={{ color: 'var(--text-muted)' }}>
          {sorted.length} result{sorted.length !== 1 ? 's' : ''}
        </span>

        {selected.size >= 2 && (
          <button onClick={() => onSelectForComparison?.(Array.from(selected))}
            className="btn-green text-xs px-4 py-1.5 font-semibold">
            Compare {selected.size}
          </button>
        )}

        {onRequestThesis && (
          <button onClick={onRequestThesis}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ background: '#F5F0FF', color: '#6B21A8', border: '1px solid #DDD6FE' }}>
            <Sparkles className="w-3.5 h-3.5" />
            AI Thesis
          </button>
        )}

        <button onClick={exportCsv}
          className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5">
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
      </div>

      {/* Table */}
      <div className="table-rh overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-10 px-3 py-3"><span className="sr-only">Select</span></th>
                <ColHeader col="ticker" label="Ticker" />
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Company</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sector</th>
                <ColHeader col="similarity_score" label="Sim" tooltip={SCORE_TOOLTIPS.similarity_score} />
                {convictionEnabled && <ColHeader col="conviction_score" label="Conv" tooltip={SCORE_TOOLTIPS.conviction_score} />}
                <ColHeader col="research_priority_score" label="RPS" tooltip={SCORE_TOOLTIPS.research_priority_score} />
                <ColHeader col="market_cap_usd_mm" label="Mkt Cap" />
                {convictionEnabled ? (
                  <>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>EPS Rev</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>SI%</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Rating</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>3M Return</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Rev Growth</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>EBITDA Mgn</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                    No peers match the current filters.
                  </td>
                </tr>
              ) : sorted.map(peer => (
                <tr key={peer.ticker} className={cn(selected.has(peer.ticker) ? 'bg-green-50' : '')}>
                  <td className="px-3 py-3">
                    <div onClick={() => toggleSelect(peer.ticker)}
                      className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${
                        selected.has(peer.ticker) ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-gray-400'
                      }`}>
                      {selected.has(peer.ticker) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <a href={`/results/${peer.ticker}`}
                      className="font-bold text-sm mono hover:underline transition-colors"
                      style={{ color: 'var(--text-primary)' }}>
                      {peer.ticker}
                    </a>
                  </td>
                  <td className="px-3 py-3 max-w-40 truncate text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {peer.company_name}
                  </td>
                  <td className="px-3 py-3 max-w-32 truncate">
                    <span className="sector-tag">{peer.gics_sub_industry ?? peer.gics_sector ?? '—'}</span>
                  </td>
                  <td className="px-3 py-3 min-w-32">
                    <div className="flex items-center gap-1">
                      <ScoreBar score={peer.similarity_score} className="flex-1" size="sm" />
                      <ScoreDetailTooltip components={peer.score_components} totalScore={peer.similarity_score} flags={peer.score_metadata.flags} />
                    </div>
                  </td>
                  {convictionEnabled && (
                    <td className="px-3 py-3"><ConvictionBar score={peer.conviction_score} /></td>
                  )}
                  <td className="px-3 py-3 min-w-28">
                    <ScoreBar score={peer.research_priority_score} size="sm" />
                  </td>
                  <td className="px-3 py-3 text-xs mono" style={{ color: 'var(--text-secondary)' }}>
                    {formatMarketCap(peer.market_cap_usd_mm)}
                  </td>
                  {convictionEnabled ? (
                    <>
                      <td className="px-3 py-3 text-xs mono"
                        style={{ color: (peer.estimates?.ntm_eps_revision_3m ?? 0) >= 0 ? 'var(--green-dk)' : 'var(--red)' }}>
                        {peer.estimates?.ntm_eps_revision_3m != null ? formatPct(peer.estimates.ntm_eps_revision_3m) : '—'}
                      </td>
                      <td className="px-3 py-3 text-xs mono" style={{ color: 'var(--text-secondary)' }}>
                        {peer.estimates?.short_interest_pct != null ? formatPct(peer.estimates.short_interest_pct, 1).replace('+','') : '—'}
                      </td>
                      <td className="px-3 py-3">
                        {peer.estimates?.consensus_label
                          ? <ConsensusBadge label={peer.estimates.consensus_label} />
                          : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-3 text-xs mono"
                        style={{ color: (peer.price.price_change_3m ?? 0) >= 0 ? 'var(--green-dk)' : 'var(--red)' }}>
                        {formatPct(peer.price.price_change_3m)}
                      </td>
                      <td className="px-3 py-3 text-xs mono"
                        style={{ color: (peer.fundamentals.revenue_growth_yoy ?? 0) >= 0 ? 'var(--green-dk)' : 'var(--red)' }}>
                        {formatPct(peer.fundamentals.revenue_growth_yoy)}
                      </td>
                      <td className="px-3 py-3 text-xs mono" style={{ color: 'var(--text-secondary)' }}>
                        {formatPct(peer.fundamentals.ebitda_margin, 1)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
