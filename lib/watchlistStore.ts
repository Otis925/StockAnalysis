export type WatchlistItem = {
  ticker: string;
  company_name: string;
  rps: number;
  similarity_score: number;
  conviction_score?: number | null;
};

export type Watchlist = {
  id: string;
  name: string;
  query_ticker: string;
  watchlist_size: number;
  peers: WatchlistItem[];
  created_at: string;
};

export const watchlistStore = new Map<string, Watchlist>();
export let watchlistCounter = 1;
export function nextId() {
  return String(watchlistCounter++);
}
