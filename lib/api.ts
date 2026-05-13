import type {
  PeerSearchRequest, PeerSearchResponse, TickerSuggestion, ThesisStreamEvent,
  TokenResponse, UserResponse, ScreenResponse, PortfolioResponse, Watchlist,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail ?? 'API error');
  }
  return res.json() as Promise<T>;
}

export async function searchPeers(request: PeerSearchRequest): Promise<PeerSearchResponse> {
  return apiFetch<PeerSearchResponse>('/api/peers', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function searchUniverse(q: string): Promise<TickerSuggestion[]> {
  if (!q.trim()) return [];
  const data = await apiFetch<{ results: TickerSuggestion[]; total: number }>(
    `/api/universe/search?q=${encodeURIComponent(q)}&limit=8`
  );
  return data.results;
}

export async function healthCheck() {
  return apiFetch<{ status: string; universe_size: number }>('/api/health');
}

export function formatPct(v: number | null, decimals = 1): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(decimals)}%`;
}

export function formatMarketCap(mm: number | null): string {
  if (mm == null) return '—';
  if (mm >= 1_000_000) return `$${(mm / 1_000_000).toFixed(1)}T`;
  if (mm >= 1_000) return `$${(mm / 1_000).toFixed(1)}B`;
  return `$${mm.toFixed(0)}M`;
}

export function formatMultiple(v: number | null): string {
  if (v == null) return '—';
  return `${v.toFixed(1)}x`;
}

export function downloadReport(ticker: string, watchlistSize: number = 25): void {
  const url = `${API_BASE}/api/report/${ticker}?watchlist_size=${watchlistSize}&use_analyst_estimates=true`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `PeerLens_${ticker}_${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
}

export function buildCompareUrl(queryTicker: string, peerTickers: string[]): string {
  return `/compare?query=${queryTicker}&peers=${peerTickers.join(',')}`;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────
function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('pl_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/api/auth/me', { headers: authHeaders() });
}

// ── Screener ──────────────────────────────────────────────────────────────────
export async function screenStocks(params: Record<string, string | number | boolean>): Promise<ScreenResponse> {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, String(v)])
  ).toString();
  return apiFetch<ScreenResponse>(`/api/screen${qs ? '?' + qs : ''}`);
}

// ── Portfolio ─────────────────────────────────────────────────────────────────
export async function analyzePortfolio(
  tickers: string[],
  watchlistSize = 10,
  useAnalystEstimates = true,
): Promise<PortfolioResponse> {
  return apiFetch<PortfolioResponse>('/api/portfolio', {
    method: 'POST',
    body: JSON.stringify({ tickers, watchlist_size: watchlistSize, use_analyst_estimates: useAnalystEstimates }),
  });
}

// ── Watchlist ─────────────────────────────────────────────────────────────────
export async function listWatchlists(): Promise<Watchlist[]> {
  return apiFetch<Watchlist[]>('/api/watchlist', { headers: authHeaders() });
}

export async function createWatchlist(name: string, query_ticker: string, watchlist_size = 25): Promise<Watchlist> {
  return apiFetch<Watchlist>('/api/watchlist', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, query_ticker, watchlist_size }),
  });
}

export async function deleteWatchlist(id: string): Promise<void> {
  await apiFetch<void>(`/api/watchlist/${id}`, { method: 'DELETE', headers: authHeaders() });
}

export async function savePeersToWatchlist(
  id: string,
  peers: { ticker: string; company_name: string; rps: number; similarity_score: number; conviction_score?: number | null }[]
): Promise<Watchlist> {
  return apiFetch<Watchlist>(`/api/watchlist/${id}/peers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ peers }),
  });
}

export async function* streamThesis(
  request: PeerSearchRequest,
): AsyncGenerator<ThesisStreamEvent> {
  const res = await fetch(`${API_BASE}/api/thesis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail ?? 'Thesis API error');
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const chunk of lines) {
      const line = chunk.trim();
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json) continue;
      try {
        yield JSON.parse(json) as ThesisStreamEvent;
      } catch {
        // skip malformed SSE lines
      }
    }
  }
}
