"""
helpers.py
Shared utility functions — safe numeric conversion and percentage formatting.
"""

import math


def safe_float(val) -> float | None:
    """
    Convert `val` to float.
    Returns None if val is None, NaN, Inf, or not numeric.
    """
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        return None


def pct(val, decimals: int = 2) -> float | None:
    """
    Convert a decimal fraction to a rounded percentage.
    e.g.  0.2834 → 28.34   (with decimals=2)
    Returns None for invalid input.
    """
    f = safe_float(val)
    if f is None:
        return None
    return round(f * 100, decimals)
