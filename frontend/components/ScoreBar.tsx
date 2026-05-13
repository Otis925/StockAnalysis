'use client';

import { cn } from '@/lib/utils';

interface ScoreBarProps {
  score: number;
  max?: number;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

function scoreColor(score: number): string {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-400';
  if (score >= 25) return 'bg-orange-400';
  return 'bg-red-400';
}

function scoreTextColor(score: number): string {
  if (score >= 75) return 'text-emerald-700 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-700 dark:text-amber-400';
  if (score >= 25) return 'text-orange-700 dark:text-orange-400';
  return 'text-red-700 dark:text-red-400';
}

export function ScoreBar({ score, max = 100, label, className, size = 'md' }: ScoreBarProps) {
  const pct = Math.min(100, (score / max) * 100);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('font-mono font-semibold', scoreTextColor(score), size === 'sm' ? 'text-xs w-7' : 'text-sm w-9')}>
        {score.toFixed(0)}
      </span>
      <div className={cn('flex-1 rounded-full bg-gray-100 dark:bg-gray-800', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className={cn('h-full rounded-full transition-all', scoreColor(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreBadge({ score, label }: { score: number; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn('text-2xl font-bold font-mono', scoreTextColor(score))}>
        {score.toFixed(0)}
      </span>
      {label && <span className="text-xs text-gray-500">{label}</span>}
    </div>
  );
}
