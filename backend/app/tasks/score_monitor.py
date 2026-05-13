"""
Daily score monitor: computes RPS for all saved watchlists, detects significant
day-over-day changes, and fires webhook alerts.

Schedule: daily at 6:00 AM ET (after price refresh at 2AM completes).
"""
import asyncio
import logging
from datetime import date, timedelta
import httpx

from app.tasks.celery_app import celery

log = logging.getLogger(__name__)


@celery.task(name="app.tasks.score_monitor.run_score_monitor")
def run_score_monitor():
    log.info("Starting daily score monitor")
    asyncio.run(_monitor_async())


async def _monitor_async():
    from app.database import AsyncSessionLocal
    from app.models.watchlist import Watchlist, WatchlistItem
    from app.models.score_history import ScoreHistory, AlertLog
    from app.models.universe import UniverseMember
    from app.scoring.similarity import SimilarityEngine
    from app.scoring.conviction import ConvictionEngine
    from app.data.estimates_fetcher import get_estimates_for_tickers
    from app.api.peers import _load_prices, _load_fundamentals, _member_to_dict
    from app.schemas.requests import PeerSearchRequest
    from app.config import settings
    from sqlalchemy import select, and_
    import numpy as np

    sim_engine = SimilarityEngine()
    conv_engine = ConvictionEngine()
    today = date.today()
    yesterday = today - timedelta(days=1)

    async with AsyncSessionLocal() as db:
        # ── Load all active watchlists ─────────────────────────────────────────
        wl_result = await db.execute(select(Watchlist))
        watchlists = wl_result.scalars().all()

        if not watchlists:
            log.info("No watchlists to monitor.")
            return

        # ── Load shared data once ──────────────────────────────────────────────
        univ_result = await db.execute(
            select(UniverseMember).where(UniverseMember.is_active == True)
        )
        universe_members = [_member_to_dict(m) for m in univ_result.scalars().all()]
        all_tickers = [m["ticker"] for m in universe_members]

        price_data, price_metadata = await _load_prices(db, all_tickers, today)
        spy_prices = price_data.get("SPY", np.array([]))
        fundamentals_data, fundamentals_metadata = await _load_fundamentals(db, all_tickers, today)

        for wl in watchlists:
            try:
                await _process_watchlist(
                    db, wl, sim_engine, conv_engine,
                    universe_members, price_data, spy_prices,
                    fundamentals_data, price_metadata, fundamentals_metadata,
                    today, yesterday,
                )
            except Exception as exc:
                log.error("Score monitor failed for watchlist %s: %s", wl.id, exc)

    log.info("Score monitor complete.")


async def _process_watchlist(
    db, wl, sim_engine, conv_engine,
    universe_members, price_data, spy_prices,
    fundamentals_data, price_metadata, fundamentals_metadata,
    today, yesterday,
):
    from app.models.universe import UniverseMember
    from app.models.score_history import ScoreHistory, AlertLog
    from app.data.estimates_fetcher import get_estimates_for_tickers
    from app.api.peers import _member_to_dict
    from app.schemas.requests import PeerSearchRequest
    from app.schemas.responses import EstimatesSnapshot
    from app.config import settings
    from sqlalchemy import select, and_
    import numpy as np

    query_member = await db.get(UniverseMember, wl.query_ticker)
    if not query_member:
        return

    internal_size = wl.watchlist_size
    req = PeerSearchRequest(
        ticker=wl.query_ticker,
        watchlist_size=internal_size,
        region="US",
        use_transcripts=False,
        use_analyst_estimates=True,
    )

    result = sim_engine.compute(
        request=req,
        query_info=_member_to_dict(query_member),
        universe_members=universe_members,
        price_data=price_data,
        spy_prices=spy_prices,
        fundamentals_data=fundamentals_data,
        price_metadata=price_metadata,
        fundamentals_metadata=fundamentals_metadata,
    )

    peer_tickers = [p.ticker for p in result.peers]
    estimates = await get_estimates_for_tickers(peer_tickers, today)
    result.peers = conv_engine.compute(result.peers, estimates)
    result.peers = conv_engine.update_rps(result.peers, estimates)

    # ── Load yesterday's scores ────────────────────────────────────────────────
    yest_result = await db.execute(
        select(ScoreHistory).where(
            and_(
                ScoreHistory.watchlist_id == wl.id,
                ScoreHistory.score_date == yesterday,
            )
        )
    )
    yesterday_scores = {r.peer_ticker: r.rps for r in yest_result.scalars().all()}

    # ── Store today's scores + detect alerts ──────────────────────────────────
    alerts: list[dict] = []
    for peer in result.peers:
        # Upsert today's score
        existing = await db.execute(
            select(ScoreHistory).where(
                and_(
                    ScoreHistory.watchlist_id == wl.id,
                    ScoreHistory.peer_ticker == peer.ticker,
                    ScoreHistory.score_date == today,
                )
            )
        )
        sh = existing.scalar_one_or_none()
        if not sh:
            db.add(ScoreHistory(
                watchlist_id=wl.id,
                peer_ticker=peer.ticker,
                score_date=today,
                rps=peer.research_priority_score,
                similarity_score=peer.similarity_score,
                conviction_score=peer.conviction_score,
            ))
        else:
            sh.rps = peer.research_priority_score

        # Check delta
        prev_rps = yesterday_scores.get(peer.ticker)
        if prev_rps is not None:
            delta = abs(peer.research_priority_score - prev_rps)
            if delta >= settings.score_alert_delta_threshold:
                alerts.append({
                    "ticker": peer.ticker,
                    "prev": prev_rps,
                    "curr": peer.research_priority_score,
                    "delta": delta,
                })

    await db.commit()

    # ── Fire alerts ────────────────────────────────────────────────────────────
    if alerts:
        log.info("Watchlist %s: %d alerts for %s", wl.id, len(alerts), wl.query_ticker)
        await _fire_alerts(db, wl, alerts, today)


async def _fire_alerts(db, wl, alerts: list[dict], today):
    from app.models.score_history import AlertLog

    # Check if watchlist has a webhook_url stored in notes (simple MVP approach)
    # In a full implementation this would be a separate AlertRule table
    webhook_url = None
    if wl.notes and wl.notes.startswith("webhook:"):
        webhook_url = wl.notes.replace("webhook:", "").strip()

    for alert in alerts:
        log_entry = AlertLog(
            watchlist_id=wl.id,
            peer_ticker=alert["ticker"],
            alert_date=today,
            prev_rps=alert["prev"],
            curr_rps=alert["curr"],
            delta=alert["delta"],
            webhook_url=webhook_url,
            delivered="pending",
        )
        db.add(log_entry)

        if webhook_url:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    payload = {
                        "watchlist_id": wl.id,
                        "query_ticker": wl.query_ticker,
                        "peer_ticker": alert["ticker"],
                        "alert_date": today.isoformat(),
                        "prev_rps": alert["prev"],
                        "curr_rps": alert["curr"],
                        "delta": alert["delta"],
                    }
                    resp = await client.post(webhook_url, json=payload)
                    log_entry.delivered = "ok" if resp.is_success else "failed"
            except Exception as exc:
                log.warning("Webhook delivery failed for %s: %s", alert["ticker"], exc)
                log_entry.delivered = "failed"

    await db.commit()
