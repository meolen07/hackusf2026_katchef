from __future__ import annotations

from backend.models.schemas import ChatTurn, IngredientRecord, UserProfileContext

from ai.chatbot.prompts import JSON_ENFORCEMENT, SYSTEM_PROMPT, TONE_RULES


def format_history(history: list[ChatTurn], max_history: int = 4) -> str:
    trimmed = history[-max_history:]
    if not trimmed:
        return "No previous conversation."
    return "\n".join(f"{turn.role.title()}: {turn.content}" for turn in trimmed)


def format_fridge_context(fridge_items: list[IngredientRecord]) -> str:
    if not fridge_items:
        return "Fridge items: none provided."

    compact_items = [
        f"{item.name} ({item.quantity}, {item.category})"
        for item in fridge_items[:10]
    ]
    extra_count = max(len(fridge_items) - 10, 0)
    suffix = f", +{extra_count} more" if extra_count else ""
    return "Fridge items: " + ", ".join(compact_items) + suffix


def format_profile_context(profile: UserProfileContext | None) -> str:
    if not profile:
        return "Profile: anonymous home cook."

    goals = ", ".join(profile.goals) if profile.goals else "none"
    preferences = ", ".join(profile.dietary_preferences) if profile.dietary_preferences else "none"
    allergies = ", ".join(profile.allergies) if profile.allergies else "none"
    display_name = profile.display_name or "KatChef user"
    level = profile.level or "Beginner"

    return (
        f"Profile: name={display_name}; level={level}; goals={goals}; "
        f"dietary={preferences}; allergies={allergies}"
    )


def build_chatbot_prompt(
    message: str,
    fridge_items: list[IngredientRecord],
    history: list[ChatTurn],
    profile: UserProfileContext | None,
    max_history: int = 4,
) -> str:
    return "\n\n".join(
        [
            SYSTEM_PROMPT.strip(),
            TONE_RULES.strip(),
            JSON_ENFORCEMENT.strip(),
            format_profile_context(profile),
            format_fridge_context(fridge_items),
            "Conversation history:\n" + format_history(history, max_history=max_history),
            f"Latest user message:\n{message}",
        ]
    )
