"""
/api/thesis — Server-Sent Events endpoint for streaming thesis cards.
Requires generate_thesis=true in the peer search request to enable.
Uses Claude to produce one thesis card per top-3 peer.
"""
import json
import logging
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.models.universe import UniverseMember
from app.models.fundamentals import Fundamentals
from app.models.price import PriceBar
from app.schemas.requests import PeerSearchRequest
from app.schemas.responses import PeerRecord, ThesisStreamEvent
from app.scoring.similarity import SimilarityEngine, _params_hash
from app.scoring.conviction import ConvictionEngine
from app.data.estimates_fetcher import get_estimates_for_tickers
from app.claude.thesis_generator import ThesisGenerator
from app.cache.redis_client import cache_get, cache_set
from app.config import settings
from app.api.peers import _load_prices, _load_fundamentals, _member_to_dict

import numpy as np
from datetime import timedelta

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/thesis", tags=["thesis"])

_sim_engine = SimilarityEngine()
_conv_engine = ConvictionEngine()


def _thesis_cache_key(ticker: str, as_of: str) -> str:
    return f"thesis:{ticker}:{as_of}"


@router.post("", response_class=StreamingResponse)
async def stream_thesis(
    request: PeerSearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Streams thesis cards as SSE. Each event is a JSON-encoded ThesisStreamEvent.
    Events: card | error | done
    """
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="Thesis generation requires ANTHROPIC_API_KEY to be configured.",
        )

    as_of = request.as_of_date or date.today()

    # Check thesis cache (keyed by ticker + date, not full params — thesis is expensive)
    cache_key = _thesis_cache_key(request.ticker, as_of.isoformat())
    cached = await cache_get(cache_key)
    if cached:
        log.info("Thesis cache hit: %s", cache_key)

        async def _cached_stream():
            for card_dict in cached:
                event = ThesisStreamEvent(event="card", **card_dict)
                yield f"data: {event.model_dump_json()}\n\n"
            yield f"data: {ThesisStreamEvent(event='done').model_dump_json()}\n\n"

        return StreamingResponse(_cached_stream(), media_type="text/event-stream")

    # ── Validate ticker ────────────────────────────────────────────────────────
    query_member = await db.get(UniverseMember, request.ticker)
    if not query_member:
        raise HTTPException(status_code=404, detail=f"Ticker '{request.ticker}' not in universe.")

    # ── Load data (same pipeline as peers endpoint) ────────────────────────────
    universe_result = await db.execute(
        select(UniverseMember).where(UniverseMember.is_active == True)
    )
    universe_members = [_member_to_dict(m) for m in universe_result.scalars().all()]
    all_tickers = [m["ticker"] for m in universe_members]

    price_data, price_metadata = await _load_prices(db, all_tickers, as_of)
    spy_prices = price_data.get("SPY", np.array([]))

    fundamentals_data, fundamentals_metadata = await _load_fundamentals(db, all_tickers, as_of)

    # ── Score peers ────────────────────────────────────────────────────────────
    override = PeerSearchRequest(
        ticker=request.ticker,
        watchlist_size=10,  # only need top-3, but score more for conviction ranking
        region=request.region,
        use_transcripts=request.use_transcripts,
        use_analyst_estimates=True,
        generate_thesis=False,
    )

    peer_response = _sim_engine.compute(
        request=override,
        query_info=_member_to_dict(query_member),
        universe_members=universe_members,
        price_data=price_data,
        spy_prices=spy_prices,
        fundamentals_data=fundamentals_data,
        price_metadata=price_metadata,
        fundamentals_metadata=fundamentals_metadata,
    )

    peers = peer_response.peers
    peer_tickers = [p.ticker for p in peers]

    # ── Conviction scoring ─────────────────────────────────────────────────────
    estimates = await get_estimates_for_tickers(peer_tickers, as_of)
    peers = _conv_engine.compute(peers, estimates)
    peers = _conv_engine.update_rps(peers, estimates)

    # Attach estimates snapshot to each peer
    for peer in peers:
        est = estimates.get(peer.ticker, {})
        if est:
            from app.schemas.responses import EstimatesSnapshot
            peer.estimates = EstimatesSnapshot(
                ntm_eps_consensus=est.get("ntm_eps_consensus"),
                ntm_eps_revision_3m=est.get("ntm_eps_revision_3m"),
                ev_ntm_ebitda=est.get("ev_ntm_ebitda"),
                analyst_count=est.get("analyst_count"),
                mean_rating=est.get("mean_rating"),
                consensus_label=est.get("consensus_label"),
                short_interest_pct=est.get("short_interest_pct_float"),
                price_target_median=est.get("price_target_median"),
            )

    # ── Stream thesis cards ────────────────────────────────────────────────────
    generator = ThesisGenerator()

    async def _event_stream():
        cards_for_cache = []
        async for event in generator.generate_stream(request.ticker, peers, max_peers=3):
            yield f"data: {event.model_dump_json()}\n\n"
            if event.event == "card" and event.card:
                cards_for_cache.append({
                    "rank": event.rank,
                    "ticker": event.ticker,
                    "card": event.card.model_dump(),
                })

        # Cache completed cards
        if cards_for_cache:
            await cache_set(cache_key, cards_for_cache, ttl=settings.thesis_cache_ttl)

    return StreamingResponse(_event_stream(), media_type="text/event-stream")
