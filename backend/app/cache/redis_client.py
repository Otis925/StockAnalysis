import json
import logging
from typing import Any, Optional
import redis.asyncio as aioredis
from app.config import settings

log = logging.getLogger(__name__)

_pool: Optional[aioredis.Redis] = None


def get_redis() -> aioredis.Redis:
    global _pool
    if _pool is None:
        _pool = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _pool


async def cache_get(key: str) -> Optional[Any]:
    try:
        redis = get_redis()
        val = await redis.get(key)
        if val is None:
            return None
        return json.loads(val)
    except Exception as exc:
        log.warning("Redis GET failed for key %s: %s", key, exc)
        return None


async def cache_set(key: str, value: Any, ttl: int = settings.score_cache_ttl) -> bool:
    try:
        redis = get_redis()
        await redis.setex(key, ttl, json.dumps(value, default=str))
        return True
    except Exception as exc:
        log.warning("Redis SET failed for key %s: %s", key, exc)
        return False


async def cache_delete(key: str) -> None:
    try:
        redis = get_redis()
        await redis.delete(key)
    except Exception as exc:
        log.warning("Redis DELETE failed for key %s: %s", key, exc)


async def cache_delete_pattern(pattern: str) -> int:
    """Delete all keys matching a pattern. Use sparingly on large keyspaces."""
    try:
        redis = get_redis()
        keys = await redis.keys(pattern)
        if keys:
            return await redis.delete(*keys)
        return 0
    except Exception as exc:
        log.warning("Redis pattern delete failed for %s: %s", pattern, exc)
        return 0


def peers_cache_key(ticker: str, as_of_date: str, params_hash: str) -> str:
    return f"peers:{ticker}:{as_of_date}:{params_hash}"


async def health_check() -> bool:
    try:
        redis = get_redis()
        return await redis.ping()
    except Exception:
        return False
