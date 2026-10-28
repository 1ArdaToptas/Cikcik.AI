"""Small in-memory sliding-window rate limiter (per client IP).

Good enough for a single-process local app; use a shared store (e.g. Redis)
if the API is ever run with multiple workers.
"""

import threading
import time
from collections import defaultdict, deque
from typing import Annotated

from fastapi import Depends, Request

from app.core.config import Settings, get_settings
from app.core.exceptions import RateLimitError

WINDOW_SECONDS = 60.0

_hits: dict[str, deque[float]] = defaultdict(deque)
_lock = threading.Lock()


def reset_rate_limits() -> None:
    with _lock:
        _hits.clear()


def rate_limit(request: Request, settings: Annotated[Settings, Depends(get_settings)]) -> None:
    limit = settings.tts_rate_limit_per_minute
    if limit <= 0:
        return
    client = request.client.host if request.client else "unknown"
    now = time.monotonic()
    with _lock:
        hits = _hits[client]
        while hits and now - hits[0] >= WINDOW_SECONDS:
            hits.popleft()
        if len(hits) >= limit:
            retry_after = max(1, int(WINDOW_SECONDS - (now - hits[0])) + 1)
            raise RateLimitError(retry_after)
        hits.append(now)
