'use client';

import { Loader2, Check } from 'lucide-react';

interface Step { label: string; status: 'pending' | 'active' | 'done'; }
interface LoadingStateProps { steps: Step[]; ticker: string; }

export function LoadingState({ steps, ticker }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#E6FAE6' }}>
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--green)' }} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Loading <span className="font-bold mono">{ticker}</span> peers
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Computing similarity scores…
        </p>
      </div>

      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
              style={{
                background: step.status === 'done' ? 'var(--green)' : step.status === 'active' ? '#E6FAE6' : 'var(--bg-surface)',
                border: `1.5px solid ${step.status === 'done' ? 'var(--green)' : step.status === 'active' ? 'var(--green)' : 'var(--border)'}`,
              }}>
              {step.status === 'done' && <Check className="w-3 h-3 text-white" />}
              {step.status === 'active' && <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--green)' }} />}
            </div>
            <span className="text-sm"
              style={{
                color: step.status === 'done' ? 'var(--text-primary)' : step.status === 'active' ? 'var(--green-dk)' : 'var(--text-muted)',
                fontWeight: step.status === 'active' ? 500 : 400,
              }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Skeleton rows */}
      <div className="w-full max-w-4xl space-y-2 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-11 rounded-lg animate-pulse"
            style={{ background: 'var(--bg-surface)', opacity: 1 - i * 0.13 }} />
        ))}
      </div>
    </div>
  );
}
