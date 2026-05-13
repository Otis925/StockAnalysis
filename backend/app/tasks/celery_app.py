from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery = Celery(
    "peerlens",
    broker=settings.celery_broker_url,
    backend=settings.celery_broker_url.replace("/1", "/2"),
    include=["app.tasks.price_refresh", "app.tasks.fundamentals_refresh", "app.tasks.score_monitor"],
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/New_York",
    enable_utc=True,
    beat_schedule={
        "refresh-prices-nightly": {
            "task": "app.tasks.price_refresh.refresh_all_prices",
            "schedule": crontab(hour=2, minute=0),  # 2:00 AM ET nightly
        },
        "refresh-fundamentals-weekly": {
            "task": "app.tasks.fundamentals_refresh.refresh_all_fundamentals",
            "schedule": crontab(hour=3, minute=0, day_of_week=1),  # Monday 3 AM ET
        },
        "score-monitor-daily": {
            "task": "app.tasks.score_monitor.run_score_monitor",
            "schedule": crontab(hour=6, minute=0),  # 6:00 AM ET daily (after price refresh)
        },
    },
)
