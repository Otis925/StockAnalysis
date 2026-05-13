'use client';

import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { PeerRecord, ScoreComponents } from '@/lib/types';
import { formatPct } from '@/lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface ComparisonChartsProps {
  peers: PeerRecord[];
  queryTicker: string;
}

function ScoreRadar({ peers }: { peers: PeerRecord[] }) {
  const dims: { key: keyof ScoreComponents; label: string; max: number }[] = [
    { key: 'return_correlation', label: 'Return Corr', max: 15 },
    { key: 'beta_proximity', label: 'Beta', max: 10 },
    { key: 'volatility_similarity', label: 'Volatility', max: 10 },
    { key: 'gics_alignment', label: 'GICS', max: 15 },
    { key: 'revenue_mix_cosine', label: 'Rev Mix', max: 10 },
    { key: 'revenue_growth_proximity', label: 'Rev Growth', max: 10 },
    { key: 'margin_profile_distance', label: 'Margins', max: 10 },
    { key: 'leverage_proximity', label: 'Leverage', max: 5 },
    { key: 'valuation_proximity', label: 'Valuation', max: 5 },
  ];

  const data = dims.map(d => {
    const row: Record<string, unknown> = { dimension: d.label };
    peers.forEach(p => {
      const val = p.score_components[d.key];
      row[p.ticker] = val != null ? Math.round((val / d.max) * 100) : 0;
    });
    return row;
  });

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Score Factor Radar</h3>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
          {peers.map((p, i) => (
            <Radar
              key={p.ticker}
              name={p.ticker}
              dataKey={p.ticker}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.1}
            />
          ))}
          <Legend />
          <Tooltip formatter={(v) => `${v}`} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MarginComparison({ peers }: { peers: PeerRecord[] }) {
  const data = peers.map(p => ({
    ticker: p.ticker,
    'Gross Margin': p.fundamentals.gross_margin != null ? +(p.fundamentals.gross_margin * 100).toFixed(1) : null,
    'EBITDA Margin': p.fundamentals.ebitda_margin != null ? +(p.fundamentals.ebitda_margin * 100).toFixed(1) : null,
    'FCF Margin': p.fundamentals.fcf_margin != null ? +(p.fundamentals.fcf_margin * 100).toFixed(1) : null,
  }));

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Margin Profile (TTM %)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="ticker" tick={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Legend />
          <Bar dataKey="Gross Margin" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="EBITDA Margin" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="FCF Margin" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueGrowthChart({ peers }: { peers: PeerRecord[] }) {
  const data = peers.map((p, i) => ({
    ticker: p.ticker,
    'Rev Growth YoY': p.fundamentals.revenue_growth_yoy != null
      ? +(p.fundamentals.revenue_growth_yoy * 100).toFixed(1)
      : null,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Revenue Growth YoY (TTM)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" barSize={24}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="ticker" tick={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }} width={50} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="Rev Growth YoY" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={(d['Rev Growth YoY'] ?? 0) >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SimilarityScoreBar({ peers }: { peers: PeerRecord[] }) {
  const data = peers.map(p => ({
    ticker: p.ticker,
    'Similarity': +p.similarity_score.toFixed(1),
    'RPS': +p.research_priority_score.toFixed(1),
  }));

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Similarity vs Research Priority</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="ticker" tick={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Similarity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="RPS" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ComparisonCharts({ peers, queryTicker }: ComparisonChartsProps) {
  if (peers.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreRadar peers={peers} />
        <SimilarityScoreBar peers={peers} />
        <MarginComparison peers={peers} />
        <RevenueGrowthChart peers={peers} />
      </div>
    </div>
  );
}
