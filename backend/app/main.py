import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api.peers import router as peers_router
from app.api.universe import router as universe_router
from app.api.thesis import router as thesis_router
from app.api.report import router as report_router
from app.api.screen import router as screen_router
from app.api.portfolio import router as portfolio_router
from app.api.auth import router as auth_router
from app.api.watchlist import router as watchlist_router
from app.database import async_engine, Base
from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting PeerLens API v3.0.0")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("Database tables verified")
    yield
    log.info("Shutting down")
    await async_engine.dispose()


app = FastAPI(
    title="PeerLens API",
    description="Similar stock peer discovery with conviction scoring, screener, portfolio overlap, and Claude thesis generation.",
    version="3.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_extra_origins = [o.strip() for o in settings.allowed_origins.split() if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(peers_router)
app.include_router(universe_router)
app.include_router(thesis_router)
app.include_router(report_router)
app.include_router(screen_router)
app.include_router(portfolio_router)
app.include_router(auth_router)
app.include_router(watchlist_router)


@app.get("/")
async def root():
    return {"name": "PeerLens API", "version": "3.0.0", "docs": "/docs"}


@app.get("/api/health")
async def health():
    from app.cache.redis_client import redis_client
    from app.database import async_engine
    from sqlalchemy import text

    db_status = "ok"
    redis_status = "ok"
    universe_size = 0

    try:
        async with async_engine.connect() as conn:
            result = await conn.execute(text("SELECT COUNT(*) FROM universe_members WHERE is_active = 1"))
            universe_size = result.scalar() or 0
    except Exception:
        db_status = "error"

    try:
        if redis_client:
            await redis_client.ping()
    except Exception:
        redis_status = "unavailable"

    from app.config import settings
    return {
        "status": "ok",
        "database": db_status,
        "redis": redis_status,
        "universe_size": universe_size,
        "claude_configured": bool(settings.anthropic_api_key),
        "estimates_source": settings.estimates_source,
    }
