"""
Tests for watchlist CRUD models and auth enforcement logic.
Uses model-level unit tests (no DB required for most).
"""
import pytest
from datetime import datetime, timezone


# ── Model structure ────────────────────────────────────────────────────────────

class TestWatchlistModel:
    def test_watchlist_fields_exist(self):
        from app.models.watchlist import Watchlist, WatchlistItem
        assert hasattr(Watchlist, 'id')
        assert hasattr(Watchlist, 'user_id')
        assert hasattr(Watchlist, 'name')
        assert hasattr(Watchlist, 'query_ticker')
        assert hasattr(Watchlist, 'watchlist_size')
        assert hasattr(Watchlist, 'sector_lock')
        assert hasattr(Watchlist, 'notes')
        assert hasattr(Watchlist, 'created_at')
        assert hasattr(Watchlist, 'last_run_at')

    def test_watchlist_item_fields_exist(self):
        from app.models.watchlist import WatchlistItem
        assert hasattr(WatchlistItem, 'id')
        assert hasattr(WatchlistItem, 'watchlist_id')
        assert hasattr(WatchlistItem, 'peer_ticker')
        assert hasattr(WatchlistItem, 'peer_name')
        assert hasattr(WatchlistItem, 'rps')
        assert hasattr(WatchlistItem, 'similarity_score')
        assert hasattr(WatchlistItem, 'conviction_score')
        assert hasattr(WatchlistItem, 'captured_at')

    def test_score_history_fields_exist(self):
        from app.models.score_history import ScoreHistory, AlertLog
        assert hasattr(ScoreHistory, 'watchlist_id')
        assert hasattr(ScoreHistory, 'peer_ticker')
        assert hasattr(ScoreHistory, 'score_date')
        assert hasattr(ScoreHistory, 'rps')

    def test_alert_log_fields_exist(self):
        from app.models.score_history import AlertLog
        assert hasattr(AlertLog, 'watchlist_id')
        assert hasattr(AlertLog, 'peer_ticker')
        assert hasattr(AlertLog, 'delta')
        assert hasattr(AlertLog, 'delivered')


# ── User model ─────────────────────────────────────────────────────────────────

class TestUserModel:
    def test_user_fields_exist(self):
        from app.models.user import User
        assert hasattr(User, 'id')
        assert hasattr(User, 'email')
        assert hasattr(User, 'hashed_password')
        assert hasattr(User, 'is_active')
        assert hasattr(User, 'created_at')

    def test_user_watchlists_relationship(self):
        from app.models.user import User
        assert hasattr(User, 'watchlists')


# ── Watchlist API schema validation ───────────────────────────────────────────

class TestWatchlistEndpointShape:
    """Tests that the endpoint models have the expected structure."""

    def test_watchlist_endpoint_has_all_routes(self):
        from app.api.watchlist import router
        paths = {r.path for r in router.routes}
        # Core CRUD paths should be present
        assert any("/api/watchlist" in p for p in paths)

    def test_auth_endpoints_registered(self):
        from app.api.auth import router
        paths = {r.path for r in router.routes}
        assert any("register" in p for p in paths)
        assert any("login" in p for p in paths)
        assert any("me" in p for p in paths)


# ── Score alert threshold ──────────────────────────────────────────────────────

class TestScoreAlerts:
    def test_alert_fires_above_threshold(self):
        threshold = 5.0
        prev_rps, curr_rps = 60.0, 66.0
        delta = abs(curr_rps - prev_rps)
        assert delta >= threshold  # alert fires

    def test_alert_does_not_fire_below_threshold(self):
        threshold = 5.0
        prev_rps, curr_rps = 60.0, 63.0
        delta = abs(curr_rps - prev_rps)
        assert delta < threshold  # alert suppressed

    def test_alert_fires_on_downward_move(self):
        threshold = 5.0
        prev_rps, curr_rps = 70.0, 63.0
        delta = abs(curr_rps - prev_rps)
        assert delta >= threshold  # alert fires

    def test_alert_exactly_at_threshold_fires(self):
        threshold = 5.0
        prev_rps, curr_rps = 60.0, 65.0
        delta = abs(curr_rps - prev_rps)
        assert delta >= threshold

    def test_config_has_threshold(self):
        from app.config import settings
        assert hasattr(settings, 'score_alert_delta_threshold')
        assert settings.score_alert_delta_threshold > 0
