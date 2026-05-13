'use client';

import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  label: string;
  status: 'pending' | 'active' | 'done';
}

interface LoadingStateProps {
  steps: Step[];
  ticker: string;
}

export function LoadingState({ steps, ticker }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 mb-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Finding peers for <span className="font-mono text-blue-600">{ticker}</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">Computing similarity scores across universe…</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
              step.status === 'done' && 'bg-emerald-500',
              step.status === 'active' && 'bg-blue-500',
              step.status === 'pending' && 'bg-gray-200 dark:bg-gray-700',
            )}>
              {step.status === 'done' && <Check className="w-3.5 h-3.5 text-white" />}
              {step.status === 'active' && <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />}
            </div>
            <span className={cn(
              'text-sm',
              step.status === 'done' && 'text-emerald-600 dark:text-emerald-400',
              step.status === 'active' && 'text-blue-600 dark:text-blue-400 font-medium',
              step.status === 'pending' && 'text-gray-400',
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Skeleton rows */}
      <div className="w-full max-w-4xl space-y-3 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    </div>
  );
}
