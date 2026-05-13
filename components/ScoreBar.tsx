'use client';

import { cn } from '@/lib/utils';

interface ScoreBarProps {
  score: number;
  max?: number;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function ScoreBar({ score, max = 100, label, className, size = 'md' }: ScoreBarProps) {
  const pct = Math.min(100, (score / max) * 100);
  const h = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('font-semibold shrink-0 mono', size === 'sm' ? 'text-xs w-7' : 'text-sm w-9')}
        style={{ color: 'var(--text-primary)' }}>
        {score.toFixed(0)}
      </span>
      <div className={cn('flex-1 score-bar-track', h)}>
        <div className="score-bar-fill h-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ScoreBadge({ score, label }: { score: number; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl font-bold mono" style={{ color: 'var(--green-dk)' }}>
        {score.toFixed(0)}
      </span>
      {label && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>}
    </div>
  );
}
