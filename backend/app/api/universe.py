from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.models.universe import UniverseMember
from app.schemas.responses import UniverseSearchResponse, TickerSuggestion, HealthResponse
from app.cache.redis_client import health_check as redis_health

router = APIRouter(tags=["universe"])


@router.get("/api/universe/search", response_model=UniverseSearchResponse)
async def search_universe(
    q: str = Query(..., min_length=1, max_length=20, description="Ticker or company name prefix"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> UniverseSearchResponse:
    q_upper = q.upper().strip()
    q_lower = q.lower().strip()

    result = await db.execute(
        select(UniverseMember)
        .where(
            UniverseMember.is_active == True,
            or_(
                UniverseMember.ticker.like(f"{q_upper}%"),
                UniverseMember.company_name.ilike(f"%{q_lower}%"),
            ),
        )
        .order_by(
            # Exact ticker match first, then company name alpha
            UniverseMember.ticker == q_upper,
            UniverseMember.market_cap_usd_mm.desc().nullslast(),
        )
        .limit(limit)
    )
    members = result.scalars().all()

    return UniverseSearchResponse(
        results=[
            TickerSuggestion(
                ticker=m.ticker,
                company_name=m.company_name,
                gics_sector=m.gics_sector,
                market_cap_usd_mm=m.market_cap_usd_mm,
            )
            for m in members
        ],
        total=len(members),
    )


@router.get("/api/universe/{ticker}", response_model=TickerSuggestion)
async def get_ticker_info(ticker: str, db: AsyncSession = Depends(get_db)) -> TickerSuggestion:
    member = await db.get(UniverseMember, ticker.upper())
    if not member:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found")
    return TickerSuggestion(
        ticker=member.ticker,
        company_name=member.company_name,
        gics_sector=member.gics_sector,
        market_cap_usd_mm=member.market_cap_usd_mm,
    )


@router.get("/api/health", response_model=HealthResponse)
async def health(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    # DB check
    db_ok = "ok"
    try:
        result = await db.execute(select(UniverseMember).limit(1))
        count_result = await db.execute(
            select(UniverseMember).where(UniverseMember.is_active == True)
        )
        universe_size = len(count_result.scalars().all())
    except Exception as exc:
        db_ok = f"error: {exc}"
        universe_size = 0

    redis_ok = "ok" if await redis_health() else "error"

    return HealthResponse(
        status="ok" if db_ok == "ok" and redis_ok == "ok" else "degraded",
        database=db_ok,
        redis=redis_ok,
        universe_size=universe_size,
    )
