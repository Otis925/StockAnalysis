from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://peerlens:peerlens_dev@localhost:5432/peerlens"
    sync_database_url: str = "postgresql://peerlens:peerlens_dev@localhost:5432/peerlens"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"

    price_source: str = "yfinance"  # "yfinance" | "polygon" | "mock"
    polygon_api_key: str = ""
    fmp_api_key: str = ""
    anthropic_api_key: str = ""

    # Estimates source: "fmp" (needs key) | "mock" (no key, deterministic)
    estimates_source: str = "mock"

    score_cache_ttl: int = 86400  # 24 hours
    thesis_cache_ttl: int = 21600  # 6 hours
    env: str = "development"

    # Universe
    default_universe: str = "sp500"
    max_universe_size: int = 3000
    min_price_history_days: int = 63

    # Claude model for thesis generation
    claude_model: str = "claude-sonnet-4-6"
    thesis_max_tokens: int = 600
    report_max_tokens: int = 2000

    # Auth / JWT
    jwt_secret: str = "change-me-in-production-use-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7

    # Rate limiting
    rate_limit_peers: str = "20/minute"
    rate_limit_thesis: str = "5/minute"
    rate_limit_screen: str = "30/minute"

    # Score alerts
    score_alert_delta_threshold: float = 5.0   # RPS delta that triggers an alert
    score_history_retain_days: int = 90

    # CORS — space-separated list of allowed origins (in addition to localhost defaults)
    # e.g. "https://your-app.vercel.app https://your-custom-domain.com"
    allowed_origins: str = ""


settings = Settings()
