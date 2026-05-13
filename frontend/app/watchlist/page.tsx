'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listWatchlists, deleteWatchlist, ApiError } from '@/lib/api';
import type { Watchlist } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('pl_token');
    if (!token) { router.push('/auth/login'); return; }
    loadWatchlists();
  }, []);

  async function loadWatchlists() {
    setLoading(true);
    try {
      const wls = await listWatchlists();
      setWatchlists(wls);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/auth/login');
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to load watchlists');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete watchlist "${name}"?`)) return;
    setDeleting(id);
    try {
      await deleteWatchlist(id);
      setWatchlists(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500 dark:text-gray-400">
        Loading watchlists…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Watchlists</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Watchlists are created when you save peers from a results page.
          </p>
        </div>
        {watchlists.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">{watchlists.length} watchlist{watchlists.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {watchlists.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">No watchlists yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Search for a stock and save the peer results to create a watchlist.
          </p>
          <a
            href="/"
            className="inline-block mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Find peers
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {watchlists.map(wl => (
            <div key={wl.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-900 dark:text-white">{wl.name}</h2>
                    <a
                      href={`/results/${wl.query_ticker}`}
                      className="text-xs font-mono font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:underline"
                    >
                      {wl.query_ticker}
                    </a>
                    {wl.sector_lock && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">sector locked</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 space-x-3">
                    <span>Created {formatDate(wl.created_at)}</span>
                    {wl.last_run_at && <span>Last run {formatDate(wl.last_run_at)}</span>}
                    <span>{wl.items.length} peer{wl.items.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/results/${wl.query_ticker}`}
                    className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    Re-run
                  </a>
                  <button
                    onClick={() => handleDelete(wl.id, wl.name)}
                    disabled={deleting === wl.id}
                    className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {deleting === wl.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>

              {wl.items.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {wl.items.slice(0, 12).map(item => (
                    <a
                      key={item.peer_ticker}
                      href={`/results/${item.peer_ticker}`}
                      className="group flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">{item.peer_ticker}</span>
                      <span className="text-xs text-gray-400">{item.rps.toFixed(0)}</span>
                    </a>
                  ))}
                  {wl.items.length > 12 && (
                    <span className="px-2.5 py-1 text-xs text-gray-400 dark:text-gray-500">
                      +{wl.items.length - 12} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
