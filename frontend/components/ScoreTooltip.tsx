'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';
import type { ScoreComponents } from '@/lib/types';
import { ScoreBar } from './ScoreBar';

const COMPONENT_LABELS: Record<keyof ScoreComponents, { label: string; max: number }> = {
  return_correlation: { label: 'Return Correlation', max: 15 },
  beta_proximity: { label: 'Beta Proximity', max: 10 },
  volatility_similarity: { label: 'Volatility Similarity', max: 10 },
  gics_alignment: { label: 'GICS Sector Alignment', max: 15 },
  revenue_mix_cosine: { label: 'Revenue Mix', max: 10 },
  revenue_growth_proximity: { label: 'Revenue Growth', max: 10 },
  margin_profile_distance: { label: 'Margin Profile', max: 10 },
  leverage_proximity: { label: 'Leverage', max: 5 },
  valuation_proximity: { label: 'Valuation Multiple', max: 5 },
  semantic_similarity: { label: 'Semantic (10-K/Transcript)', max: 10 },
};

interface ScoreDetailTooltipProps {
  components: ScoreComponents;
  totalScore: number;
  flags: string[];
}

export function ScoreDetailTooltip({ components, totalScore, flags }: ScoreDetailTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Info className="w-3.5 h-3.5" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 w-72 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-4"
            sideOffset={8}
            align="start"
          >
            <p className="text-xs font-semibold text-gray-500 mb-3">Score Breakdown</p>
            <div className="space-y-2">
              {(Object.keys(COMPONENT_LABELS) as (keyof ScoreComponents)[]).map(key => {
                const val = components[key];
                if (val == null) return null;
                const { label, max } = COMPONENT_LABELS[key];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
                    <div className="flex-1">
                      <ScoreBar score={(val / max) * 100} size="sm" />
                    </div>
                    <span className="text-xs font-mono text-gray-600 w-8 text-right">
                      {val.toFixed(1)}/{max}
                    </span>
                  </div>
                );
              })}
            </div>
            {flags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-amber-600 font-medium">⚠ Data notes:</p>
                <ul className="mt-1 space-y-0.5">
                  {flags.map(f => (
                    <li key={f} className="text-xs text-gray-400">{f.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}
            <Tooltip.Arrow className="fill-gray-200 dark:fill-gray-700" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

interface SimpleTooltipProps {
  content: string;
  children: React.ReactNode;
}

export function SimpleTooltip({ content, children }: SimpleTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 max-w-xs rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-xl"
            sideOffset={6}
          >
            {content}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
