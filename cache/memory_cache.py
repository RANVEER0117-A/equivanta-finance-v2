"""
memory_cache.py
Simple in-process dictionary cache with TTL expiry.
Redis-ready structure — swap the backend in production by replacing
the CACHE dict with a redis.Redis() client and adjusting get/set/exists.

TTL default: 15 minutes (900 seconds)
"""

import time

# ── Storage ───────────────────────────────────────────────────────────────────
CACHE: dict[str, tuple] = {}   # key → (value, stored_at)
TTL: int = 15 * 60             # 900 seconds


# ── Public API ────────────────────────────────────────────────────────────────

def get(key: str):
    """
    Retrieve value for `key`.
    Returns None if the key is absent or expired.
    """
    if key in CACHE:
        value, stored_at = CACHE[key]
        if time.time() - stored_at < TTL:
            return value
        # Expired — evict
        del CACHE[key]
    return None


def set(key: str, value) -> None:
    """Store `value` under `key` with the current timestamp."""
    CACHE[key] = (value, time.time())


def exists(key: str) -> bool:
    """
    Return True if `key` is present and not yet expired.
    Evicts stale entries on check.
    """
    if key in CACHE:
        _, stored_at = CACHE[key]
        if time.time() - stored_at < TTL:
            return True
        del CACHE[key]
    return False


def delete(key: str) -> None:
    """Manually evict a key (useful for forced refresh)."""
    CACHE.pop(key, None)


def clear() -> None:
    """Wipe the entire cache."""
    CACHE.clear()


def stats() -> dict:
    """Return cache diagnostics — useful for a /cache/stats debug endpoint."""
    now = time.time()
    entries = []
    for k, (_, stored_at) in list(CACHE.items()):
        age = now - stored_at
        entries.append({
            "key":        k,
            "age_s":      round(age, 1),
            "ttl_left_s": max(0, round(TTL - age, 1)),
        })
    return {"ttl_seconds": TTL, "count": len(entries), "entries": entries}
