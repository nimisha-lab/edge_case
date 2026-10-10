from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from app.core.config import build_connect_args, settings

Base = declarative_base()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=1800,
    connect_args=build_connect_args(),
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def ensure_postgis_extension() -> None:
    """Enable PostGIS in its own transaction.

    ``IF NOT EXISTS`` makes this a no-op when the extension is already present
    (common on managed providers such as Neon or Supabase). Callers wrap this in
    a try/except so a permission error cannot abort the rest of the setup.
    """
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))


async def init_db() -> None:
    # Import the models so every table is registered on ``Base.metadata``
    # before ``create_all`` runs. This keeps ``init_db`` self-contained when it
    # is invoked directly (app startup, ``seed.py`` or a one-off script).
    import app.models.models  # noqa: F401

    try:
        await ensure_postgis_extension()
    except Exception as exc:  # pragma: no cover - depends on DB permissions
        print(f"[init_db] WARNING: could not enable PostGIS extension: {exc}")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
