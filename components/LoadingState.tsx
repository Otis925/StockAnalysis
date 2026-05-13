'use client';

import { Loader2, Check } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse-glow"
          style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#22d3ee' }} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Finding peers for{' '}
          <span className="font-mono" style={{ color: '#22d3ee', textShadow: '0 0 12px rgba(34,211,238,0.4)' }}>
            {ticker}
          </span>
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Computing similarity scores across universe…
        </p>
      </div>

      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
              style={{
                background: step.status === 'done' ? '#34d39920'
                  : step.status === 'active' ? '#22d3ee20'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${step.status === 'done' ? '#34d399' : step.status === 'active' ? '#22d3ee' : 'rgba(255,255,255,0.1)'}`,
              }}>
              {step.status === 'done' && <Check className="w-3 h-3" style={{ color: '#34d399' }} />}
              {step.status === 'active' && <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#22d3ee' }} />}
            </div>
            <span className="text-xs transition-colors"
              style={{
                color: step.status === 'done' ? '#34d399'
                  : step.status === 'active' ? '#22d3ee'
                  : 'var(--text-muted)',
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
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              opacity: 1 - i * 0.14,
            }} />
        ))}
      </div>
    </div>
  );
}
