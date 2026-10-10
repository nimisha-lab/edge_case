"""Application configuration.

Settings are read from environment variables with an optional ``backend/.env``
file, so the project runs the same way locally (plain Python virtualenv) and in
a container. The database URL is normalised here so every consumer (the async
engine, Alembic, the seeder) receives an ``asyncpg``-ready connection string.
"""

from pathlib import Path
from typing import Optional
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


def normalize_database_url(url: str) -> tuple[str, Optional[str]]:
    """Return an asyncpg-ready URL together with the requested SSL mode.

    Cloud providers usually hand out ``postgres://`` (Heroku/Render style) or
    ``postgresql://`` connection strings while SQLAlchemy needs an explicit
    driver name, so any ``postgres://`` / ``postgresql://`` scheme is rewritten
    to ``postgresql+asyncpg://``.

    ``sslmode`` (and ``ssl``) are understood by libpq but are *not* accepted as
    keyword arguments by asyncpg, so they are stripped from the URL and
    returned separately for the engine to forward through ``connect_args``.
    """
    if not url:
        return url, None

    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://") :]
    elif url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://") :]

    ssl_mode: Optional[str] = None
    if "?" in url:
        parsed = urlparse(url)
        remaining = []
        for key, value in parse_qsl(parsed.query, keep_blank_values=True):
            if key in ("sslmode", "ssl"):
                ssl_mode = value or "require"
            else:
                remaining.append((key, value))
        url = urlunparse(parsed._replace(query=urlencode(remaining)))

    return url, ssl_mode


class Settings(BaseSettings):
    PROJECT_NAME: str = "Civic Infrastructure Coordination Engine"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/civic_db"
    )
    DB_SSL_MODE: Optional[str] = None

    API_V1_STR: str = "/api/v1"

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @model_validator(mode="before")
    @classmethod
    def _normalize_database_url(cls, data):
        if isinstance(data, dict):
            raw_url = data.get("DATABASE_URL")
            if raw_url:
                normalized, ssl_mode = normalize_database_url(raw_url)
                data["DATABASE_URL"] = normalized
                if ssl_mode and not data.get("DB_SSL_MODE"):
                    data["DB_SSL_MODE"] = ssl_mode
        return data


settings = Settings()


def build_connect_args() -> dict:
    """Driver-level ``connect_args`` for ``create_async_engine``.

    asyncpg accepts ``ssl`` as a boolean or as one of the libpq SSL mode
    strings (``require``, ``verify-ca``, ``verify-full`` ...), so the mode
    extracted from ``DATABASE_URL`` is forwarded as-is. Local databases without
    an explicit SSL mode connect over plain TCP.
    """
    ssl_mode = settings.DB_SSL_MODE
    if ssl_mode and ssl_mode.lower() != "disable":
        return {"ssl": ssl_mode}
    return {}
