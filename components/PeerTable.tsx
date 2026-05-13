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
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />;
  return sortDir === 'desc'
    ? <ChevronDown className="w-3 h-3" style={{ color: '#22d3ee' }} />
    : <ChevronUp className="w-3 h-3" style={{ color: '#22d3ee' }} />;
}

function ConvictionScore({ score }: { score: number | null }) {
  if (score == null) return <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>—</span>;
  const color = score >= 70 ? '#34d399' : score >= 45 ? '#fbbf24' : '#f87171';
  return (
    <div className="flex items-center gap-1.5 min-w-24">
      <span className="font-mono text-xs font-semibold w-8 text-right" style={{ color }}>{score.toFixed(0)}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
      </div>
    </div>
  );
}

function ConsensusBadge({ label }: { label: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    'Strong Buy': { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
    'Buy':        { bg: 'rgba(52,211,153,0.08)', color: '#6ee7b7' },
    'Hold':       { bg: 'rgba(148,163,184,0.1)',  color: '#94a3b8' },
    'Sell':       { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  };
  const s = styles[label] ?? { bg: 'rgba(148,163,184,0.08)', color: '#94a3b8' };
  return (
    <span className="text-xs font-medium px-1.5 py-0.5 rounded"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
      {label}
    </span>
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
        return [p.ticker, `"${p.company_name}"`, p.gics_sector ?? '', p.similarity_score.toFixed(1),
          p.conviction_score?.toFixed(1) ?? '', p.research_priority_score.toFixed(1),
          p.market_cap_usd_mm?.toFixed(0) ?? '',
          p.price.price_change_3m != null ? (p.price.price_change_3m * 100).toFixed(1) + '%' : '',
          p.estimates?.ntm_eps_revision_3m != null ? (p.estimates.ntm_eps_revision_3m * 100).toFixed(1) + '%' : '',
          p.estimates?.short_interest_pct != null ? (p.estimates.short_interest_pct * 100).toFixed(1) + '%' : '',
          p.estimates?.consensus_label ?? ''].join(',');
      }
      return [p.ticker, `"${p.company_name}"`, p.gics_sector ?? '', p.similarity_score.toFixed(1),
        p.research_priority_score.toFixed(1), p.market_cap_usd_mm?.toFixed(0) ?? '',
        p.price.price_change_3m != null ? (p.price.price_change_3m * 100).toFixed(1) + '%' : '',
        p.fundamentals.revenue_growth_yoy != null ? (p.fundamentals.revenue_growth_yoy * 100).toFixed(1) + '%' : '',
        p.fundamentals.ebitda_margin != null ? (p.fundamentals.ebitda_margin * 100).toFixed(1) + '%' : ''].join(',');
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `peers_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const ColHeader = ({ col, label, tooltip }: { col: SortKey; label: string; tooltip?: string }) => (
    <th className="px-3 py-3 text-left">
      <div className="flex items-center gap-1">
        <button onClick={() => toggleSort(col)}
          className="flex items-center gap-1 text-xs font-semibold tracking-wider uppercase transition-colors"
          style={{ color: sortKey === col ? '#22d3ee' : 'var(--text-muted)' }}
          onMouseEnter={e => { if (sortKey !== col) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { if (sortKey !== col) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
          {label}
          <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
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
  const selectStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    outline: 'none',
  };

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

        <span className="text-xs font-mono ml-auto" style={{ color: 'var(--text-muted)' }}>
          {sorted.length} peer{sorted.length !== 1 ? 's' : ''}
        </span>

        {selected.size >= 2 && (
          <button onClick={() => onSelectForComparison?.(Array.from(selected))}
            className="btn-primary text-xs px-4 py-1.5 rounded-lg font-medium">
            Compare {selected.size} selected
          </button>
        )}

        {onRequestThesis && (
          <button onClick={onRequestThesis}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#c4b5fd' }}>
            <Sparkles className="w-3.5 h-3.5" />
            AI Thesis
          </button>
        )}

        <button onClick={exportCsv}
          className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg">
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
      </div>

      {/* Table */}
      <div className="table-tech overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-10 px-3 py-3"><span className="sr-only">Select</span></th>
                <ColHeader col="ticker" label="Ticker" />
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}>Company</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}>Sector</th>
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
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>3M Ret</th>
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
              ) : (
                sorted.map((peer) => (
                  <tr key={peer.ticker}
                    className={cn('transition-colors', selected.has(peer.ticker) ? 'bg-cyan-400/5' : '')}
                    style={{ cursor: 'default' }}>
                    <td className="px-3 py-3">
                      <div
                        onClick={() => toggleSelect(peer.ticker)}
                        className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${
                          selected.has(peer.ticker)
                            ? 'border-cyan-400 bg-cyan-400/20'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}>
                        {selected.has(peer.ticker) && <div className="w-2 h-2 rounded-sm bg-cyan-400" />}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <a href={`/results/${peer.ticker}`}
                        className="font-mono font-bold text-sm transition-all hover:text-glow"
                        style={{ color: '#22d3ee', letterSpacing: '0.04em' }}>
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
                        <ScoreDetailTooltip
                          components={peer.score_components}
                          totalScore={peer.similarity_score}
                          flags={peer.score_metadata.flags}
                        />
                      </div>
                    </td>
                    {convictionEnabled && (
                      <td className="px-3 py-3"><ConvictionScore score={peer.conviction_score} /></td>
                    )}
                    <td className="px-3 py-3 min-w-28">
                      <ScoreBar score={peer.research_priority_score} size="sm" />
                    </td>
                    <td className="px-3 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatMarketCap(peer.market_cap_usd_mm)}
                    </td>
                    {convictionEnabled ? (
                      <>
                        <td className="px-3 py-3 font-mono text-xs"
                          style={{ color: (peer.estimates?.ntm_eps_revision_3m ?? 0) >= 0 ? '#34d399' : '#f87171' }}>
                          {peer.estimates?.ntm_eps_revision_3m != null ? formatPct(peer.estimates.ntm_eps_revision_3m) : '—'}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {peer.estimates?.short_interest_pct != null
                            ? formatPct(peer.estimates.short_interest_pct, 1).replace('+', '') : '—'}
                        </td>
                        <td className="px-3 py-3">
                          {peer.estimates?.consensus_label
                            ? <ConsensusBadge label={peer.estimates.consensus_label} />
                            : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-3 font-mono text-xs"
                          style={{ color: (peer.price.price_change_3m ?? 0) >= 0 ? '#34d399' : '#f87171' }}>
                          {formatPct(peer.price.price_change_3m)}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs"
                          style={{ color: (peer.fundamentals.revenue_growth_yoy ?? 0) >= 0 ? '#34d399' : '#f87171' }}>
                          {formatPct(peer.fundamentals.revenue_growth_yoy)}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
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
