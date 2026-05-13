'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchUniverse } from '@/lib/api';
import type { TickerSuggestion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatMarketCap } from '@/lib/api';

interface TickerInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (suggestion: TickerSuggestion) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function TickerInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter ticker symbol… e.g. NVDA',
  className,
  autoFocus,
}: TickerInputProps) {
  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const results = await searchUniverse(q);
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, fetchSuggestions]);

  const handleSelect = (s: TickerSuggestion) => {
    onChange(s.ticker);
    setOpen(false);
    setActiveIdx(-1);
    onSelect?.(s);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(suggestions[activeIdx]); }
    if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono placeholder:font-sans placeholder:text-gray-400"
          spellCheck={false}
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={s.ticker}
              onMouseDown={() => handleSelect(s)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                activeIdx === i && 'bg-blue-50 dark:bg-blue-900/30',
              )}
            >
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 w-16 shrink-0">{s.ticker}</span>
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{s.company_name}</span>
              <span className="text-xs text-gray-400 shrink-0">{formatMarketCap(s.market_cap_usd_mm)}</span>
              {s.gics_sector && (
                <span className="text-xs text-gray-400 hidden md:block shrink-0 max-w-32 truncate">{s.gics_sector}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
