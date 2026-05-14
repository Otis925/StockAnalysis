'use client';

import { useEffect, useRef, useState } from 'react';
import { X, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import type { PeerRecord, ThesisCard } from '@/lib/types';
import { fetchThesis } from '@/lib/api';

interface ThesisPanelProps {
  queryTicker: string;
  peers: PeerRecord[];
  onClose: () => void;
}

const CACHE_TTL_MS = 30 * 60 * 1000;

function cacheKey(ticker: string) {
  return `pl_thesis_v2_${ticker}`;
}

function readCache(ticker: string): ThesisCard[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(ticker));
    if (!raw) return null;
    const entry: { cards: ThesisCard[]; t: number } = JSON.parse(raw);
    if (Date.now() - entry.t > CACHE_TTL_MS) return null;
    return entry.cards;
  } catch {
    return null;
  }
}

function writeCache(ticker: string, cards: ThesisCard[]) {
  try {
    localStorage.setItem(cacheKey(ticker), JSON.stringify({ cards, t: Date.now() }));
  } catch {
    // storage quota exceeded — ignore
  }
}

function SectionTag({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color }}>
      {label}
    </span>
  );
}

function ThesisSection({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="space-y-1.5">
      <SectionTag label={label} color={color} />
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{value}</p>
    </div>
  );
}

function ThesisCardView({ card, rank }: { card: ThesisCard; rank: number }) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
            #{rank}
          </span>
          <span className="font-bold text-base mono" style={{ color: 'var(--text-primary)' }}>
            {card.ticker}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{card.company_name}</span>
        </div>
      </div>
      <div className="space-y-4">
        <ThesisSection label="Competitive Moat" value={card.moat} color="#007B00" />
        <div className="h-px" style={{ background: 'var(--border)' }} />
        <ThesisSection label="Downside Risk" value={card.drawdown_risk} color="#FF5000" />
        <div className="h-px" style={{ background: 'var(--border)' }} />
        <ThesisSection label="Near-Term Catalyst" value={card.catalyst} color="#2563EB" />
        <div className="h-px" style={{ background: 'var(--border)' }} />
        <ThesisSection label="Exit Criteria" value={card.exit_criteria} color="#D97706" />
        <div className="h-px" style={{ background: 'var(--border)' }} />
        <ThesisSection label="Conviction Rationale" value={card.conviction_rationale} color="#7C3AED" />
      </div>
    </div>
  );
}

function LoadingCard({ ticker, name }: { ticker: string; name: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-bold mono" style={{ color: 'var(--text-primary)' }}>{ticker}</span>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{name}</span>
      </div>
      <div className="space-y-3 animate-pulse">
        {[80, 60, 90, 70, 75].map((w, i) => (
          <div key={i} className="h-3 rounded-full" style={{ background: 'var(--border)', width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

export function ThesisPanel({ queryTicker, peers, onClose }: ThesisPanelProps) {
  const top5 = peers.slice(0, 5);
  const [cards, setCards] = useState<ThesisCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const load = async (force = false) => {
    if (loadingRef.current && !force) return;
    loadingRef.current = true;
    setError(null);
    setLoading(true);

    if (!force) {
      const cached = readCache(queryTicker);
      if (cached) {
        setCards(cached);
        setLoading(false);
        loadingRef.current = false;
        return;
      }
    }

    try {
      const result = await fetchThesis(queryTicker, top5.length);
      setCards(result.cards);
      writeCache(queryTicker, result.cards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thesis');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="w-full max-w-xl flex flex-col h-full overflow-hidden"
        style={{ background: 'var(--bg)', borderLeft: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--green)' }} />
            <div>
              <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                AI Thesis Cards
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Top peers for <span className="font-mono font-semibold">{queryTicker}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <button onClick={() => load(true)}
                className="btn-ghost p-1.5 rounded-lg"
                title="Regenerate">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="px-5 py-2.5 text-xs" style={{ background: '#FFFBEB', color: '#92400E', borderBottom: '1px solid #FDE68A' }}>
          AI-generated analysis for research purposes only. Not investment advice.
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && top5.map((p) => (
            <LoadingCard key={p.ticker} ticker={p.ticker} name={p.company_name} />
          ))}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <AlertCircle className="w-10 h-10" style={{ color: 'var(--red)' }} />
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Could not load thesis</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{error}</p>
              </div>
              <button onClick={() => load(true)} className="btn-green px-5 py-2 text-sm font-semibold">
                Retry
              </button>
            </div>
          )}

          {cards && !loading && cards.map((card) => (
            <ThesisCardView key={card.ticker} card={card} rank={card.rank} />
          ))}
        </div>
      </div>
    </div>
  );
}
