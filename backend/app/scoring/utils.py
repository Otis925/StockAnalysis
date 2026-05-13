import numpy as np
from typing import Optional


def winsorize(arr: np.ndarray, lower: float, upper: float) -> np.ndarray:
    return np.clip(arr, lower, upper)


def safe_corr(a: np.ndarray, b: np.ndarray) -> float:
    """Pearson correlation with NaN safety."""
    if len(a) < 10 or np.std(a) == 0 or np.std(b) == 0:
        return 0.0
    return float(np.corrcoef(a, b)[0, 1])


def ols_beta(stock_returns: np.ndarray, market_returns: np.ndarray) -> float:
    """OLS beta of stock vs market. Returns 1.0 on failure."""
    if len(stock_returns) < 20:
        return 1.0
    cov = np.cov(stock_returns, market_returns)
    var_m = cov[1, 1]
    if var_m == 0:
        return 1.0
    return float(cov[0, 1] / var_m)


def annualized_vol(daily_log_returns: np.ndarray) -> float:
    """Annualized volatility from daily log returns."""
    if len(daily_log_returns) < 10:
        return 0.30  # fallback assumption
    return float(np.std(daily_log_returns) * np.sqrt(252))


def log_returns(prices: np.ndarray) -> np.ndarray:
    """Compute daily log returns from price array."""
    return np.diff(np.log(prices + 1e-10))


def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    """Cosine similarity between two vectors."""
    n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
    if n1 == 0 or n2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (n1 * n2))


def euclidean_distance(v1: np.ndarray, v2: np.ndarray) -> float:
    return float(np.linalg.norm(v1 - v2))


def safe_ratio(numerator: Optional[float], denominator: Optional[float], fallback: float = 0.0) -> float:
    if numerator is None or denominator is None:
        return fallback
    if denominator == 0:
        return fallback
    return numerator / denominator
