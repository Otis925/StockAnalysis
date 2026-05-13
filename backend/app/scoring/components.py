"""
Individual similarity score components — exact formulas from spec.
Each function returns a float in [0, max_points].
All inputs are point-in-time safe (caller responsibility).
"""
import numpy as np
import math
from typing import Optional
from app.scoring.utils import (
    safe_corr, ols_beta, annualized_vol, log_returns,
    cosine_similarity, euclidean_distance, winsorize, safe_ratio
)


# ─── Component 1: Return Correlation (0–15) ───────────────────────────────────

def score_return_correlation(
    peer_adj_closes: np.ndarray,
    query_adj_closes: np.ndarray,
) -> tuple[float, list[str]]:
    flags = []
    n = min(len(peer_adj_closes), len(query_adj_closes))
    if n < 63:
        return 0.0, ["insufficient_price_history"]
    if n < 126:
        flags.append("limited_price_history")

    peer_ret = log_returns(peer_adj_closes[-252:])
    query_ret = log_returns(query_adj_closes[-252:])
    min_len = min(len(peer_ret), len(query_ret))
    peer_ret, query_ret = peer_ret[-min_len:], query_ret[-min_len:]

    r = safe_corr(peer_ret, query_ret)
    r = float(np.clip(r, -1.0, 1.0))
    score = 15.0 * (r + 1.0) / 2.0
    return round(score, 4), flags


# ─── Component 2: Beta Proximity (0–10) ───────────────────────────────────────

def score_beta_proximity(
    peer_adj_closes: np.ndarray,
    query_adj_closes: np.ndarray,
    spy_adj_closes: np.ndarray,
) -> tuple[float, list[str]]:
    flags = []
    peer_ret = log_returns(peer_adj_closes[-252:])
    query_ret = log_returns(query_adj_closes[-252:])
    spy_ret = log_returns(spy_adj_closes[-252:])

    min_len = min(len(peer_ret), len(query_ret), len(spy_ret))
    if min_len < 63:
        return 0.0, ["insufficient_price_history"]

    peer_ret = peer_ret[-min_len:]
    query_ret = query_ret[-min_len:]
    spy_ret = spy_ret[-min_len:]

    beta_peer = ols_beta(peer_ret, spy_ret)
    beta_query = ols_beta(query_ret, spy_ret)
    delta_beta = abs(beta_peer - beta_query)
    score = 10.0 * max(0.0, 1.0 - delta_beta / 1.5)
    return round(score, 4), flags


# ─── Component 3: Volatility Similarity (0–10) ────────────────────────────────

def score_volatility_similarity(
    peer_adj_closes: np.ndarray,
    query_adj_closes: np.ndarray,
) -> tuple[float, list[str]]:
    flags = []
    peer_ret = log_returns(peer_adj_closes[-252:])
    query_ret = log_returns(query_adj_closes[-252:])
    min_len = min(len(peer_ret), len(query_ret))
    if min_len < 63:
        return 0.0, ["insufficient_price_history"]

    vol_peer = annualized_vol(peer_ret[-min_len:])
    vol_query = annualized_vol(query_ret[-min_len:])
    delta_vol = abs(vol_peer - vol_query)
    score = 10.0 * max(0.0, 1.0 - delta_vol / 0.40)
    return round(score, 4), flags


# ─── Component 4: GICS Alignment (0–15) ───────────────────────────────────────

def score_gics_alignment(
    peer_gics: dict,
    query_gics: dict,
) -> tuple[float, list[str]]:
    """
    peer_gics / query_gics: dicts with keys
      sub_industry, industry, industry_group, sector
    """
    flags = []
    if not peer_gics.get("sector") or not query_gics.get("sector"):
        flags.append("missing_gics")
        return 0.0, flags

    if peer_gics.get("sub_industry") and peer_gics["sub_industry"] == query_gics.get("sub_industry"):
        return 15.0, flags
    if peer_gics.get("industry") and peer_gics["industry"] == query_gics.get("industry"):
        return 10.0, flags
    if peer_gics.get("industry_group") and peer_gics["industry_group"] == query_gics.get("industry_group"):
        return 7.0, flags
    if peer_gics["sector"] == query_gics["sector"]:
        return 5.0, flags
    return 0.0, flags


# ─── Component 5: Revenue Mix Cosine (0–10) ───────────────────────────────────

def score_revenue_mix(
    peer_segment_mix: Optional[dict],
    query_segment_mix: Optional[dict],
    peer_sic: Optional[str],
    query_sic: Optional[str],
) -> tuple[float, list[str]]:
    """
    Segment mix: {'hardware': 0.6, 'software': 0.3, 'services': 0.1}
    Falls back to SIC code proximity if segment data unavailable.
    """
    flags = []

    if peer_segment_mix and query_segment_mix:
        all_segments = sorted(set(peer_segment_mix) | set(query_segment_mix))
        v_peer = np.array([peer_segment_mix.get(s, 0.0) for s in all_segments])
        v_query = np.array([query_segment_mix.get(s, 0.0) for s in all_segments])
        cos = cosine_similarity(v_peer, v_query)
        return round(10.0 * max(0.0, cos), 4), flags

    # Fallback: SIC proximity
    flags.append("segment_data_unavailable_sic_fallback")
    if peer_sic and query_sic:
        if peer_sic[:4] == query_sic[:4]:
            return 8.0, flags
        if peer_sic[:3] == query_sic[:3]:
            return 5.0, flags
        if peer_sic[:2] == query_sic[:2]:
            return 3.0, flags
    return 0.0, flags


# ─── Component 6: Revenue Growth Proximity (0–10) ─────────────────────────────

def score_revenue_growth_proximity(
    peer_rev_growth: Optional[float],
    query_rev_growth: Optional[float],
) -> tuple[float, list[str]]:
    flags = []
    if peer_rev_growth is None or query_rev_growth is None:
        flags.append("missing_revenue_growth")
        return 0.0, flags

    peer_g = float(np.clip(peer_rev_growth, -0.5, 2.0))
    query_g = float(np.clip(query_rev_growth, -0.5, 2.0))
    delta = abs(peer_g - query_g)
    score = 10.0 * max(0.0, 1.0 - delta / 0.40)
    return round(score, 4), flags


# ─── Component 7: Margin Profile Distance (0–10) ──────────────────────────────

def score_margin_profile(
    peer_margins: dict,
    query_margins: dict,
) -> tuple[float, list[str]]:
    """
    margins: {'gross': float, 'ebitda': float, 'fcf': float}
    Missing margin dimension → use 0 for that dimension, flag it.
    """
    flags = []
    dims = ["gross", "ebitda", "fcf"]
    v_peer, v_query = [], []

    for dim in dims:
        p_val = peer_margins.get(dim)
        q_val = query_margins.get(dim)
        if p_val is None or q_val is None:
            flags.append(f"missing_margin_{dim}")
            v_peer.append(0.0)
            v_query.append(0.0)
        else:
            v_peer.append(float(np.clip(p_val, -1.0, 1.0)))
            v_query.append(float(np.clip(q_val, -1.0, 1.0)))

    d = euclidean_distance(np.array(v_peer), np.array(v_query))
    score = 10.0 * math.exp(-d / 0.25)
    return round(score, 4), flags


# ─── Component 8: Leverage Proximity (0–5) ────────────────────────────────────

def score_leverage_proximity(
    peer_net_debt_ebitda: Optional[float],
    query_net_debt_ebitda: Optional[float],
) -> tuple[float, list[str]]:
    flags = []
    if peer_net_debt_ebitda is None or query_net_debt_ebitda is None:
        flags.append("missing_leverage")
        return 0.0, flags

    p_lev = float(np.clip(peer_net_debt_ebitda, -2.0, 15.0))
    q_lev = float(np.clip(query_net_debt_ebitda, -2.0, 15.0))
    delta = abs(p_lev - q_lev)
    score = 5.0 * max(0.0, 1.0 - delta / 5.0)
    return round(score, 4), flags


# ─── Component 9: Valuation Multiple Proximity (0–5) ──────────────────────────

def score_valuation_proximity(
    peer_ev_ebitda: Optional[float],
    query_ev_ebitda: Optional[float],
) -> tuple[float, list[str]]:
    """Uses NTM EBITDA if available; falls back to TTM."""
    flags = []
    if peer_ev_ebitda is None or query_ev_ebitda is None:
        flags.append("missing_ev_ebitda")
        return 0.0, flags

    p_val = float(np.clip(peer_ev_ebitda, 0.0, 60.0))
    q_val = float(np.clip(query_ev_ebitda, 0.0, 60.0))
    delta = abs(p_val - q_val)
    score = 5.0 * max(0.0, 1.0 - delta / 20.0)
    return round(score, 4), flags
