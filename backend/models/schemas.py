from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class HealthResponse(CamelModel):
    status: Literal["ok"] = "ok"
    app_name: str
    environment: str
    host: str
    port: int
    firebase_enabled: bool
    google_credentials_configured: bool
    vision_configured: bool
    chatbot_configured: bool
    max_upload_size_mb: int
    cors_origins: list[str] = Field(default_factory=list)


class IngredientRecord(CamelModel):
    name: str = Field(min_length=1, max_length=80)
    quantity: str = Field(default="1 item", min_length=1, max_length=60)
    category: str = Field(default="Other", min_length=1, max_length=40)
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)


class VisionDetectResponse(CamelModel):
    ingredients: list[IngredientRecord] = Field(default_factory=list)


class ChatTurn(CamelModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class UserProfileContext(CamelModel):
    display_name: str | None = None
    level: str | None = None
    goals: list[str] = Field(default_factory=list)
    dietary_preferences: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)


class ChatRecipeSuggestion(CamelModel):
    title: str = Field(min_length=1, max_length=80)
    reason: str = Field(min_length=1, max_length=160)
    cook_time: str = Field(default="15 min", min_length=1, max_length=40)
    ingredients: list[str] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)


class ChatbotMessageRequest(CamelModel):
    message: str = Field(min_length=1, max_length=1200)
    fridge_items: list[IngredientRecord] = Field(default_factory=list)
    history: list[ChatTurn] = Field(default_factory=list)
    profile: UserProfileContext | None = None


class ChatbotMessageResponse(CamelModel):
    reply: str
    suggested_recipes: list[ChatRecipeSuggestion] = Field(default_factory=list)
    tips: list[str] = Field(default_factory=list)
