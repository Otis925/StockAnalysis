import type { PeerSearchResponse } from './types';

function fmt(v: number | null | undefined, decimals = 1, suffix = '%'): string {
  if (v == null) return '—';
  return `${(v * 100).toFixed(decimals)}${suffix}`;
}

function fmtCap(mm: number | null | undefined): string {
  if (mm == null) return '—';
  if (mm >= 1_000_000) return `$${(mm / 1_000_000).toFixed(1)}T`;
  if (mm >= 1_000) return `$${(mm / 1_000).toFixed(1)}B`;
  return `$${mm.toFixed(0)}M`;
}

function fmtX(v: number | null | undefined): string {
  if (v == null) return '—';
  return `${v.toFixed(1)}x`;
}

function colorClass(v: number | null | undefined): string {
  if (v == null) return '#737373';
  return v >= 0 ? '#007B00' : '#FF5000';
}

export function generateReport(data: PeerSearchResponse): void {
  const { query, peers } = data;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const rows = peers.slice(0, 25).map((p, i) => {
    const rev3m = p.price.price_change_3m;
    const revGrowth = p.fundamentals.revenue_growth_yoy;
    return `
      <tr style="border-bottom:1px solid #E5E5E5;">
        <td style="padding:8px 12px;font-weight:600;color:#1A1A1A;font-family:monospace;">${i + 1}. ${p.ticker}</td>
        <td style="padding:8px 12px;color:#737373;max-width:180px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${p.company_name}</td>
        <td style="padding:8px 12px;color:#737373;">${p.gics_sector ?? '—'}</td>
        <td style="padding:8px 12px;font-family:monospace;color:#007B00;font-weight:600;">${p.similarity_score.toFixed(0)}</td>
        <td style="padding:8px 12px;font-family:monospace;color:#1A1A1A;">${p.research_priority_score.toFixed(0)}</td>
        <td style="padding:8px 12px;font-family:monospace;color:#737373;">${fmtCap(p.market_cap_usd_mm)}</td>
        <td style="padding:8px 12px;font-family:monospace;color:${colorClass(rev3m)};">${rev3m != null ? (rev3m >= 0 ? '+' : '') + (rev3m * 100).toFixed(1) + '%' : '—'}</td>
        <td style="padding:8px 12px;font-family:monospace;color:${colorClass(revGrowth)};">${revGrowth != null ? (revGrowth >= 0 ? '+' : '') + (revGrowth * 100).toFixed(1) + '%' : '—'}</td>
        <td style="padding:8px 12px;font-family:monospace;color:#737373;">${fmt(p.fundamentals.ebitda_margin)}</td>
        <td style="padding:8px 12px;font-family:monospace;color:#737373;">${fmtX(p.ev_ebitda)}</td>
        <td style="padding:8px 12px;font-family:monospace;color:#737373;">${p.estimates?.consensus_label ?? '—'}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>PeerLens Report — ${query.ticker}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1A1A1A; background: #fff; font-size: 13px; }
    .page { max-width: 1100px; margin: 0 auto; padding: 40px 32px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #00C805; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-circle { width: 32px; height: 32px; background: #00C805; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .logo-name { font-size: 18px; font-weight: 700; color: #1A1A1A; }
    .ticker-block { text-align: right; }
    .ticker { font-size: 32px; font-weight: 800; font-family: monospace; color: #1A1A1A; }
    .company { font-size: 16px; color: #737373; margin-top: 2px; }
    .meta { font-size: 12px; color: #B0B0B0; margin-top: 6px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #737373; margin-bottom: 12px; margin-top: 28px; }
    .stats-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; }
    .stat-card { background: #F5F5F5; border-radius: 8px; padding: 12px 16px; min-width: 120px; }
    .stat-label { font-size: 11px; color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .stat-value { font-size: 16px; font-weight: 700; font-family: monospace; color: #1A1A1A; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #F5F5F5; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #737373; white-space: nowrap; }
    .disclaimer { margin-top: 32px; padding: 16px; background: #FFF8EB; border-radius: 8px; border: 1px solid #FDE68A; font-size: 11px; color: #92400E; line-height: 1.6; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">
      <div class="logo-circle">
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M1 7L6 12L17 1" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span class="logo-name">PeerLens</span>
    </div>
    <div class="ticker-block">
      <div class="ticker">${query.ticker}</div>
      <div class="company">${query.company_name}</div>
      <div class="meta">${query.gics_sector ?? ''} · ${fmtCap(query.market_cap_usd_mm)} · Generated ${date}</div>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-label">Peers Found</div>
      <div class="stat-value">${peers.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Candidates Evaluated</div>
      <div class="stat-value">${data.total_candidates_evaluated}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Methodology</div>
      <div class="stat-value">v${data.methodology_version}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">As of Date</div>
      <div class="stat-value" style="font-size:13px;">${query.as_of_date}</div>
    </div>
  </div>

  <div class="section-title">Peer Watchlist — Top ${Math.min(peers.length, 25)} by Research Priority Score</div>
  <table>
    <thead>
      <tr>
        <th>Ticker</th>
        <th>Company</th>
        <th>Sector</th>
        <th>Sim</th>
        <th>RPS</th>
        <th>Mkt Cap</th>
        <th>3M Ret</th>
        <th>Rev Growth</th>
        <th>EBITDA Mgn</th>
        <th>EV/EBITDA</th>
        <th>Consensus</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is generated by PeerLens for research and informational purposes only.
    Scores are algorithmic outputs derived from public market data and do not constitute investment advice, a recommendation to buy or sell any security,
    or a solicitation of an offer to buy or sell any security. Past performance is not indicative of future results.
    Always conduct your own due diligence and consult a qualified financial advisor before making investment decisions.
  </div>
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) {
    alert('Please allow pop-ups to download the report.');
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}
