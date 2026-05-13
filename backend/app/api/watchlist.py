"""
/api/watchlist — CRUD for saved peer watchlists.
All endpoints require authentication.
"""
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.watchlist import Watchlist, WatchlistItem
from app.models.score_history import ScoreHistory
from app.auth import get_current_user

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


class WatchlistCreate(BaseModel):
    name: str
    query_ticker: str
    watchlist_size: int = 25
    sector_lock: bool = False
    notes: Optional[str] = None
    webhook_url: Optional[str] = None  # for score alerts


class WatchlistSummary(BaseModel):
    id: str
    name: str
    query_ticker: str
    watchlist_size: int
    notes: Optional[str]
    created_at: str
    last_run_at: Optional[str]
    peer_count: int


class WatchlistDetail(WatchlistSummary):
    peers: list[dict]


class SavePeersRequest(BaseModel):
    peer_tickers: list[dict]  # [{ticker, name, rps, similarity_score, conviction_score}]


@router.get("", response_model=list[WatchlistSummary])
async def list_watchlists(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Watchlist).where(Watchlist.user_id == user.id).order_by(Watchlist.created_at.desc())
    )
    watchlists = result.scalars().all()
    out = []
    for w in watchlists:
        item_count_result = await db.execute(
            select(WatchlistItem).where(WatchlistItem.watchlist_id == w.id)
        )
        items = item_count_result.scalars().all()
        out.append(WatchlistSummary(
            id=w.id,
            name=w.name,
            query_ticker=w.query_ticker,
            watchlist_size=w.watchlist_size,
            notes=w.notes,
            created_at=w.created_at.isoformat(),
            last_run_at=w.last_run_at.isoformat() if w.last_run_at else None,
            peer_count=len(items),
        ))
    return out


@router.post("", response_model=WatchlistSummary, status_code=201)
async def create_watchlist(
    body: WatchlistCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wl = Watchlist(
        user_id=user.id,
        name=body.name,
        query_ticker=body.query_ticker.upper(),
        watchlist_size=body.watchlist_size,
        sector_lock=str(body.sector_lock).lower(),
        notes=body.notes,
    )
    db.add(wl)
    await db.commit()
    await db.refresh(wl)
    return WatchlistSummary(
        id=wl.id,
        name=wl.name,
        query_ticker=wl.query_ticker,
        watchlist_size=wl.watchlist_size,
        notes=wl.notes,
        created_at=wl.created_at.isoformat(),
        last_run_at=None,
        peer_count=0,
    )


@router.get("/{watchlist_id}", response_model=WatchlistDetail)
async def get_watchlist(
    watchlist_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wl = await db.get(Watchlist, watchlist_id)
    if not wl or wl.user_id != user.id:
        raise HTTPException(status_code=404, detail="Watchlist not found.")

    items_result = await db.execute(
        select(WatchlistItem)
        .where(WatchlistItem.watchlist_id == watchlist_id)
        .order_by(WatchlistItem.rps.desc())
    )
    items = items_result.scalars().all()

    peers = [
        {
            "ticker": item.peer_ticker,
            "name": item.peer_name,
            "rps": item.rps,
            "similarity_score": item.similarity_score,
            "conviction_score": item.conviction_score,
            "captured_at": item.captured_at.isoformat(),
        }
        for item in items
    ]

    return WatchlistDetail(
        id=wl.id,
        name=wl.name,
        query_ticker=wl.query_ticker,
        watchlist_size=wl.watchlist_size,
        notes=wl.notes,
        created_at=wl.created_at.isoformat(),
        last_run_at=wl.last_run_at.isoformat() if wl.last_run_at else None,
        peer_count=len(peers),
        peers=peers,
    )


@router.post("/{watchlist_id}/peers", status_code=204)
async def save_peers(
    watchlist_id: str,
    body: SavePeersRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Replace the peer list for a watchlist and record a score history snapshot."""
    wl = await db.get(Watchlist, watchlist_id)
    if not wl or wl.user_id != user.id:
        raise HTTPException(status_code=404, detail="Watchlist not found.")

    # Delete existing items
    existing = await db.execute(select(WatchlistItem).where(WatchlistItem.watchlist_id == watchlist_id))
    for item in existing.scalars().all():
        await db.delete(item)

    today = date.today()
    new_items = []
    for peer in body.peer_tickers:
        item = WatchlistItem(
            watchlist_id=watchlist_id,
            peer_ticker=peer.get("ticker", ""),
            peer_name=peer.get("name"),
            rps=peer.get("rps"),
            similarity_score=peer.get("similarity_score"),
            conviction_score=peer.get("conviction_score"),
        )
        new_items.append(item)
        # Score history snapshot
        db.add(ScoreHistory(
            watchlist_id=watchlist_id,
            peer_ticker=peer.get("ticker", ""),
            score_date=today,
            rps=peer.get("rps"),
            similarity_score=peer.get("similarity_score"),
            conviction_score=peer.get("conviction_score"),
        ))

    db.add_all(new_items)
    wl.last_run_at = datetime.utcnow()
    await db.commit()


@router.delete("/{watchlist_id}", status_code=204)
async def delete_watchlist(
    watchlist_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wl = await db.get(Watchlist, watchlist_id)
    if not wl or wl.user_id != user.id:
        raise HTTPException(status_code=404, detail="Watchlist not found.")
    await db.delete(wl)
    await db.commit()
