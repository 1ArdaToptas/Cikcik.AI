from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok", "degraded"])
    version: str
    provider: str
    model_available: bool
