from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    model_available = settings.piper_model_available
    return HealthResponse(
        status="ok" if model_available else "degraded",
        version=settings.app_version,
        provider="piper",
        model_available=model_available,
    )
