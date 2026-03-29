from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.models.schemas import ChatbotMessageRequest, ChatbotMessageResponse
from backend.services.chatbot_service import generate_chatbot_reply

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/message", response_model=ChatbotMessageResponse)
async def send_message(payload: ChatbotMessageRequest) -> ChatbotMessageResponse:
    try:
        return generate_chatbot_reply(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
