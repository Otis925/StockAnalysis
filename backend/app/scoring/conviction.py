"""
ConvictionEngine: 6-component, peer-relative conviction scoring.
All scores are percentile-ranked WITHIN the returned peer set.
This means conviction scores are comparable only within a single search result.

Component reference:
  1. EPS Revision Momentum    20 pts  (requires estimates)
  2. Price Momentum vs Peers  20 pts  (requires price snapshots)
  3. Valuation Discount       20 pts  (requires EV/EBITDA)
  4. Short Interest           15 pts  (requires SI data)
  5. Analyst Consensus        15 pts  (requires ratings, NOT percentile)
  6. Piotroski F-Score        10 pts  (from fundamentals)

Total = 100.
"""
import numpy as np
from typing import Optional
from app.schemas.responses import PeerRecord, ConvictionComponents


# ─── Percentile rank ──────────────────────────────────────────────────────────

def _percentile_rank(value: float, all_values: list[float]) -> float:
    """
    Mid-rank percentile: fraction of values below + half the tied fraction.
    Returns 0.0–1.0.
    """
    n = len(all_values)
    if n == 0:
        return 0.5
    below = sum(1 for v in all_values if v < value)
    equal = sum(1 for v in all_values if v == value)
    return (below + 0.5 * equal) / n


# ─── Individual components ────────────────────────────────────────────────────

def _score_eps_revision(
    ticker: str,
    all_estimates: dict[str, dict],
) -> Optional[float]:
    """
    EPS revision momentum (0–20).
    Returns None if data unavailable for this ticker.
    """
    est = all_estimates.get(ticker, {})
    rev = est.get("ntm_eps_revision_3m")
    if rev is None:
        return None

    # Collect all revisions in peer set for percentile rank
    all_revs = [
        float(np.clip(e.get("ntm_eps_revision_3m", 0.0), -0.5, 0.5))
        for e in all_estimates.values()
        if e.get("ntm_eps_revision_3m") is not None
    ]
    if not all_revs:
        return None

    rev_clipped = float(np.clip(rev, -0.5, 0.5))
    pct = _percentile_rank(rev_clipped, all_revs)
    return round(20.0 * pct, 4)


def _score_price_momentum(
    ticker: str,
    all_peers: list[PeerRecord],
) -> Optional[float]:
    """
    Price momentum relative to peer median (0–20).
    Averages 1M, 3M, 6M relative returns.
    """
    # Build median returns across peer set
    def _ret(p: PeerRecord, period: str) -> Optional[float]:
        return getattr(p.price, f"price_change_{period}", None)

    def _median(peers: list[PeerRecord], period: str) -> Optional[float]:
        vals = [_ret(p, period) for p in peers if _ret(p, period) is not None]
        return float(np.median(vals)) if vals else None

    med_1m = _median(all_peers, "1m")
    med_3m = _median(all_peers, "3m")
    med_6m = _median(all_peers, "6m")

    # Find this ticker in peer list
    target = next((p for p in all_peers if p.ticker == ticker), None)
    if target is None:
        return None

    composites = []
    if med_1m is not None and target.price.price_change_1m is not None:
        composites.append(target.price.price_change_1m - med_1m)
    if med_3m is not None and target.price.price_change_3m is not None:
        composites.append(target.price.price_change_3m - med_3m)
    if med_6m is not None and target.price.price_change_6m is not None:
        composites.append(target.price.price_change_6m - med_6m)

    if not composites:
        return None

    composite = float(np.clip(np.mean(composites), -0.3, 0.3))

    # All composites for percentile rank
    all_composites = []
    for p in all_peers:
        comps = []
        if med_1m is not None and p.price.price_change_1m is not None:
            comps.append(p.price.price_change_1m - med_1m)
        if med_3m is not None and p.price.price_change_3m is not None:
            comps.append(p.price.price_change_3m - med_3m)
        if med_6m is not None and p.price.price_change_6m is not None:
            comps.append(p.price.price_change_6m - med_6m)
        if comps:
            all_composites.append(float(np.clip(np.mean(comps), -0.3, 0.3)))

    if not all_composites:
        return None

    pct = _percentile_rank(composite, all_composites)
    return round(20.0 * pct, 4)


def _score_valuation_discount(
    ticker: str,
    all_peers: list[PeerRecord],
    all_estimates: dict[str, dict],
) -> Optional[float]:
    """
    Valuation discount to peer median EV/NTM EBITDA (0–20).
    Cheaper = higher conviction score.
    Uses NTM EV/EBITDA from estimates if available; falls back to fundamentals TTM.
    """
    def _ev_ebitda(p: PeerRecord, estimates: dict) -> Optional[float]:
        # Prefer NTM from estimates
        est = estimates.get(p.ticker, {})
        ntm = est.get("ev_ntm_ebitda")
        if ntm and 0 < ntm < 200:
            return ntm
        # Fallback: estimate from current price and TTM (already computed in similarity engine)
        return None  # will be filled by per-peer score_components or skip

    all_vals = []
    for p in all_peers:
        v = _ev_ebitda(p, all_estimates)
        if v is not None:
            all_vals.append((p.ticker, float(np.clip(v, 0, 100))))

    if len(all_vals) < 2:
        return None

    val_dict = dict(all_vals)
    target_val = val_dict.get(ticker)
    if target_val is None:
        return None

    median_val = float(np.median([v for _, v in all_vals]))
    if median_val <= 0:
        return None

    # Discount: positive = peer is cheaper than median
    discount = float(np.clip((median_val - target_val) / median_val, -1.0, 1.0))
    all_discounts = [
        float(np.clip((median_val - v) / median_val, -1.0, 1.0))
        for _, v in all_vals
    ]

    pct = _percentile_rank(discount, all_discounts)
    return round(20.0 * pct, 4)


def _score_short_interest(
    ticker: str,
    all_estimates: dict[str, dict],
) -> Optional[float]:
    """
    Short interest (0–15). Lower SI = higher score (inverted percentile).
    """
    est = all_estimates.get(ticker, {})
    si = est.get("short_interest_pct_float")
    if si is None:
        return None

    all_si = [
        float(np.clip(e.get("short_interest_pct_float", 0.0), 0, 0.5))
        for e in all_estimates.values()
        if e.get("short_interest_pct_float") is not None
    ]
    if not all_si:
        return None

    si_clipped = float(np.clip(si, 0, 0.5))
    pct = _percentile_rank(si_clipped, all_si)
    return round(15.0 * (1.0 - pct), 4)  # invert: lower SI = higher score


def _score_analyst_consensus(
    ticker: str,
    all_estimates: dict[str, dict],
) -> Optional[float]:
    """
    Analyst consensus rating (0–15). Absolute scale (not peer-relative).
    mean_rating is 1.0–5.0 (Sell to Strong Buy).
    """
    est = all_estimates.get(ticker, {})
    rating = est.get("mean_rating")
    if rating is None:
        return 7.5  # neutral if no coverage
    rating_clipped = float(np.clip(rating, 1.0, 5.0))
    return round(15.0 * (rating_clipped - 1.0) / 4.0, 4)


def _score_piotroski(peer: PeerRecord) -> Optional[float]:
    """
    Piotroski F-Score component (0–10). Absolute scale.
    """
    f = peer.fundamentals.piotroski_f_score
    if f is None:
        return None
    return round(10.0 * float(np.clip(f, 0, 9)) / 9.0, 4)


# ─── Conviction engine ────────────────────────────────────────────────────────

class ConvictionEngine:
    """
    Computes conviction scores for a peer set.
    Inputs: list of PeerRecord (with price/fundamentals populated) + estimates dict.
    Mutates each PeerRecord in-place (adds conviction_score + conviction_components).
    Returns the same list.
    """

    def compute(
        self,
        peers: list[PeerRecord],
        estimates: dict[str, dict],
    ) -> list[PeerRecord]:
        for peer in peers:
            comps = ConvictionComponents()
            total = 0.0
            max_possible = 0.0
            missing_pts = 0.0

            # Component 1: EPS revision
            s1 = _score_eps_revision(peer.ticker, estimates)
            comps.eps_revision_momentum = s1
            if s1 is not None:
                total += s1
                max_possible += 20.0
            else:
                missing_pts += 20.0

            # Component 2: Price momentum
            s2 = _score_price_momentum(peer.ticker, peers)
            comps.price_momentum = s2
            if s2 is not None:
                total += s2
                max_possible += 20.0
            else:
                missing_pts += 20.0

            # Component 3: Valuation discount
            s3 = _score_valuation_discount(peer.ticker, peers, estimates)
            comps.valuation_discount = s3
            if s3 is not None:
                total += s3
                max_possible += 20.0
            else:
                missing_pts += 20.0

            # Component 4: Short interest
            s4 = _score_short_interest(peer.ticker, estimates)
            comps.short_interest = s4
            if s4 is not None:
                total += s4
                max_possible += 15.0
            else:
                missing_pts += 15.0

            # Component 5: Analyst consensus
            s5 = _score_analyst_consensus(peer.ticker, estimates)
            comps.analyst_consensus = s5
            if s5 is not None:
                total += s5
                max_possible += 15.0
            else:
                missing_pts += 15.0

            # Component 6: Piotroski
            s6 = _score_piotroski(peer)
            comps.piotroski_f_score = s6
            if s6 is not None:
                total += s6
                max_possible += 10.0
            else:
                missing_pts += 10.0

            # Rescale to 100 using available components
            if max_possible > 0:
                conviction = round(total * (100.0 / max_possible), 1)
            else:
                conviction = None

            peer.conviction_components = comps
            peer.conviction_score = conviction

        return peers

    def update_rps(
        self,
        peers: list[PeerRecord],
        estimates: dict[str, dict],
    ) -> list[PeerRecord]:
        """
        Recompute Research Priority Score using conviction.
        RPS = 0.50 * SIM + 0.30 * CONV + 0.20 * coverage_bonus
        """
        for peer in peers:
            est = estimates.get(peer.ticker, {})
            analyst_count = est.get("analyst_count") or 0
            coverage_bonus = 100.0 if analyst_count >= 3 else 50.0

            if peer.conviction_score is not None:
                rps = (
                    0.50 * peer.similarity_score
                    + 0.30 * peer.conviction_score
                    + 0.20 * coverage_bonus
                )
            else:
                rps = 0.70 * peer.similarity_score + 0.30 * coverage_bonus

            peer.research_priority_score = round(rps, 1)

        # Re-sort by updated RPS
        peers.sort(key=lambda p: p.research_priority_score, reverse=True)
        return peers
