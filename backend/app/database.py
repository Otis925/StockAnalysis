from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import create_engine
from app.config import settings

_is_sqlite = "sqlite" in settings.database_url

# Async engine — pool args are PostgreSQL-only
if _is_sqlite:
    async_engine = create_async_engine(
        settings.database_url,
        echo=settings.env == "development",
        connect_args={"check_same_thread": False},
    )
    sync_engine = create_engine(
        settings.sync_database_url,
        connect_args={"check_same_thread": False},
    )
else:
    async_engine = create_async_engine(
        settings.database_url,
        pool_size=10,
        max_overflow=20,
        echo=settings.env == "development",
    )
    sync_engine = create_engine(
        settings.sync_database_url,
        pool_size=5,
        max_overflow=10,
    )

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
