'use client';

import { useState } from 'react';
import { createWatchlist, savePeersToWatchlist, listWatchlists, ApiError } from '@/lib/api';
import type { PeerRecord, Watchlist } from '@/lib/types';

interface Props {
  queryTicker: string;
  peers: PeerRecord[];
}

type State = 'idle' | 'open' | 'creating' | 'saving' | 'done' | 'error';

export default function WatchlistButton({ queryTicker, peers }: Props) {
  const [state, setState] = useState<State>('idle');
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [name, setName] = useState(`${queryTicker} peers`);
  const [selectedId, setSelectedId] = useState<string>('__new__');
  const [errorMsg, setErrorMsg] = useState('');

  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('pl_token');

  async function open() {
    if (!isLoggedIn) { window.location.href = '/auth/login'; return; }
    setState('open');
    try {
      const wls = await listWatchlists();
      setWatchlists(wls);
    } catch {
      // Silently ignore — user can still create new
    }
  }

  async function save() {
    setState('saving');
    try {
      let watchlistId = selectedId;

      if (selectedId === '__new__') {
        if (!name.trim()) { setErrorMsg('Enter a name'); setState('open'); return; }
        setState('creating');
        const wl = await createWatchlist(name.trim(), queryTicker, peers.length);
        watchlistId = wl.id;
      }

      setState('saving');
      await savePeersToWatchlist(
        watchlistId,
        peers.map(p => ({
          ticker: p.ticker,
          company_name: p.company_name,
          rps: p.research_priority_score,
          similarity_score: p.similarity_score,
          conviction_score: p.conviction_score,
        }))
      );
      setState('done');
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Save failed');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <button disabled className="px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg">
        Saved ✓
      </button>
    );
  }

  if (state === 'idle') {
    return (
      <button
        onClick={open}
        className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
      >
        Save watchlist
      </button>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600 dark:text-red-400">{errorMsg}</span>
        <button onClick={() => setState('idle')} className="text-xs text-gray-500 hover:text-gray-700 underline">Dismiss</button>
      </div>
    );
  }

  // open / creating / saving
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={selectedId}
        onChange={e => setSelectedId(e.target.value)}
        className="text-sm px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="__new__">+ New watchlist</option>
        {watchlists.map(w => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>

      {selectedId === '__new__' && (
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Watchlist name"
          className="text-sm px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
        />
      )}

      <button
        onClick={save}
        disabled={state === 'creating' || state === 'saving'}
        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
      >
        {state === 'creating' ? 'Creating…' : state === 'saving' ? 'Saving…' : 'Save'}
      </button>

      <button
        onClick={() => setState('idle')}
        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        Cancel
      </button>
    </div>
  );
}
