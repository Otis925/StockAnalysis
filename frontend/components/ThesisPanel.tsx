'use client';

import { useEffect, useRef, useState } from 'react';
import type { PeerRecord, PeerSearchRequest, ThesisCard } from '@/lib/types';
import { streamThesis } from '@/lib/api';

interface ThesisPanelProps {
  queryTicker: string;
  peers: PeerRecord[];
  request: PeerSearchRequest;
  onClose: () => void;
}

interface CardState {
  peer: PeerRecord;
  card: ThesisCard | null;
  loading: boolean;
  error: string | null;
}

function ConvictionBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  const color =
    score >= 70 ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700' :
    score >= 45 ? 'bg-amber-900/40 text-amber-300 border-amber-700' :
                  'bg-red-900/40 text-red-300 border-red-700';
  return (
    <span className={`text-xs font-mono border rounded px-1.5 py-0.5 ${color}`}>
      CONV {score.toFixed(0)}
    </span>
  );
}

function ThesisCardDisplay({ state }: { state: CardState }) {
  const { peer, card, loading, error } = state;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white">{peer.ticker}</span>
              <ConvictionBadge score={peer.conviction_score} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{peer.company_name}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">RPS</div>
          <div className="text-sm font-mono text-blue-400">{peer.research_priority_score.toFixed(1)}</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading && (
          <div className="flex items-center gap-2 text-gray-400 py-4">
            <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-sm">Generating thesis...</span>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm py-2">
            Failed to generate thesis: {error}
          </div>
        )}

        {card && (
          <div className="space-y-4">
            <ThesisField label="Competitive Moat" value={card.moat} color="blue" />
            <ThesisField label="Downside Risk" value={card.drawdown_risk} color="red" />
            <ThesisField label="Near-Term Catalyst" value={card.catalyst} color="emerald" />
            <ThesisField label="Exit Criteria" value={card.exit_criteria} color="amber" />
            <ThesisField label="Conviction Rationale" value={card.conviction_rationale} color="purple" />
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <span className="text-xs text-gray-600 font-mono">{card.model_version}</span>
              <span className="text-xs text-gray-600">
                {card.input_token_count != null && card.output_token_count != null
                  ? `${card.input_token_count}→${card.output_token_count} tokens`
                  : null}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThesisField({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'blue' | 'red' | 'emerald' | 'amber' | 'purple';
}) {
  const borderMap = {
    blue: 'border-blue-700',
    red: 'border-red-700',
    emerald: 'border-emerald-700',
    amber: 'border-amber-700',
    purple: 'border-purple-700',
  };
  const labelMap = {
    blue: 'text-blue-400',
    red: 'text-red-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
  };

  return (
    <div className={`pl-3 border-l-2 ${borderMap[color]}`}>
      <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${labelMap[color]}`}>
        {label}
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">{value}</p>
    </div>
  );
}

export function ThesisPanel({ queryTicker, peers, request, onClose }: ThesisPanelProps) {
  const top3 = peers.slice(0, 3);
  const [cardStates, setCardStates] = useState<CardState[]>(
    top3.map((p) => ({ peer: p, card: null, loading: true, error: null }))
  );
  const streamingRef = useRef(false);

  useEffect(() => {
    if (streamingRef.current) return;
    streamingRef.current = true;

    const run = async () => {
      try {
        const streamRequest = { ...request, generate_thesis: true };
        for await (const event of streamThesis(streamRequest)) {
          if (event.event === 'card' && event.card && event.rank != null) {
            const idx = event.rank - 1;
            setCardStates((prev) =>
              prev.map((s, i) =>
                i === idx ? { ...s, card: event.card!, loading: false, error: null } : s
              )
            );
          } else if (event.event === 'error' && event.rank != null) {
            const idx = event.rank - 1;
            setCardStates((prev) =>
              prev.map((s, i) =>
                i === idx ? { ...s, loading: false, error: event.error ?? 'Unknown error' } : s
              )
            );
          } else if (event.event === 'done') {
            // Mark any still-loading cards as failed
            setCardStates((prev) =>
              prev.map((s) =>
                s.loading ? { ...s, loading: false, error: 'No response received' } : s
              )
            );
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error';
        setCardStates((prev) =>
          prev.map((s) => (s.loading ? { ...s, loading: false, error: msg } : s))
        );
      }
    };

    run();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-gray-950 border-l border-gray-700 flex flex-col h-full overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">AI Thesis Cards</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Top 3 peers for <span className="font-mono text-blue-400">{queryTicker}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Close thesis panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Disclaimer */}
        <div className="px-6 py-2 bg-amber-950/30 border-b border-amber-900/40 shrink-0">
          <p className="text-xs text-amber-400/80">
            AI-generated analysis for research purposes only. Not investment advice.
            LLM output does not affect quantitative scores.
          </p>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cardStates.map((state, i) => (
            <div key={state.peer.ticker}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-gray-500">#{i + 1}</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>
              <ThesisCardDisplay state={state} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
