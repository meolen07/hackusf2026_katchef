from __future__ import annotations

import json
import logging
import re
from itertools import islice
from typing import Iterable

from ai.chatbot.chain import build_chatbot_prompt
from backend.config.settings import get_settings
from backend.models.schemas import (
    ChatRecipeSuggestion,
    ChatbotMessageRequest,
    ChatbotMessageResponse,
)

logger = logging.getLogger(__name__)

TARGET_RECIPE_MIN = 10
TARGET_RECIPE_MAX = 20
RECIPE_STEP_MIN = 4
MAX_TITLE_LENGTH = 80
MAX_REASON_LENGTH = 160
MAX_COOK_TIME_LENGTH = 40
MAX_RECIPE_LIST_ITEMS = 8
MAX_STEP_LENGTH = 160
FAST_PATH_KEYWORDS = (
    "what can i cook",
    "what should i cook",
    "recipe idea",
    "recipe ideas",
    "dinner idea",
    "dinner ideas",
    "healthy dinner",
    "quick dinner",
    "meal idea",
    "meal ideas",
    "what should i use",
)


def _strip_json_fence(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"^```json", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    return cleaned


def _truncate_text(value: object, limit: int, fallback: str = "") -> str:
    text = str(value or "").strip()
    if not text:
        return fallback
    if len(text) <= limit:
        return text
    return text[: max(limit - 1, 1)].rstrip(" ,.-") + "…"


def _ingredient_names(request: ChatbotMessageRequest) -> list[str]:
    return [item.name for item in request.fridge_items]


def _should_use_fast_path(request: ChatbotMessageRequest) -> bool:
    if request.fridge_items:
        return False

    message = request.message.lower().strip()
    if any(keyword in message for keyword in FAST_PATH_KEYWORDS):
        return True

    return False


def _recipe_ingredients(
    ingredient_names: list[str],
    *fallbacks: str,
    limit: int = 4,
) -> list[str]:
    picked = list(islice(ingredient_names, limit))
    for fallback in fallbacks:
        if len(picked) >= limit:
            break
        if fallback not in picked:
            picked.append(fallback)
    return picked[:limit]


def _unique_suggestions(suggestions: Iterable[ChatRecipeSuggestion]) -> list[ChatRecipeSuggestion]:
    seen: set[str] = set()
    unique: list[ChatRecipeSuggestion] = []
    for suggestion in suggestions:
        key = suggestion.title.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        unique.append(suggestion)
    return unique


def _fallback_steps_for_suggestion(suggestion: ChatRecipeSuggestion) -> list[str]:
    ingredients = suggestion.ingredients or ["your main ingredients"]
    joined_ingredients = ", ".join(ingredients[:4])
    title_lower = suggestion.title.lower()

    if "salad" in title_lower:
        return [
            f"Wash, dry, and prep {joined_ingredients} into bite-size pieces.",
            "Build your base in a large bowl and season lightly with salt, pepper, and something bright.",
            "Add protein, crunchy toppings, or cheese if you have them so the salad eats like dinner.",
            "Toss right before serving so everything stays fresh instead of going limp.",
        ]

    if "soup" in title_lower or "broth" in title_lower:
        return [
            f"Start a pot with a little oil, then soften the key ingredients like {joined_ingredients}.",
            "Pour in broth or water, season well, and simmer until the flavors taste settled.",
            "Add quick-cooking ingredients near the end so they stay bright and tender.",
            "Taste, adjust the seasoning, and finish with herbs, citrus, or chili before serving.",
        ]

    if "toast" in title_lower:
        return [
            "Toast the bread until crisp enough to hold toppings without going soggy.",
            f"Cook or warm the main topping ingredients like {joined_ingredients}.",
            "Pile everything onto the toast while it is still warm and season it aggressively enough to feel intentional.",
            "Finish with something sharp or fresh like herbs, lemon, or chili flakes and serve right away.",
        ]

    if "taco" in title_lower or "wrap" in title_lower or "quesadilla" in title_lower:
        return [
            f"Prep and season the filling ingredients, using {joined_ingredients} as your main mix.",
            "Cook the filling in a hot pan until the vegetables soften and the flavors concentrate.",
            "Warm the tortillas or wrap so they fold cleanly instead of cracking.",
            "Assemble, add sauce or acid, and serve while everything is still hot and crisp.",
        ]

    if "pasta" in title_lower or "noodle" in title_lower:
        return [
            "Boil the pasta or noodles in well-salted water until just tender.",
            f"Meanwhile, cook the main ingredients like {joined_ingredients} in a separate pan with oil and seasoning.",
            "Add a splash of cooking water, then toss everything together until glossy and well coated.",
            "Taste, adjust with salt, acid, or cheese, and serve immediately.",
        ]

    return [
        f"Prep the main ingredients first, keeping {joined_ingredients} ready to go so cooking stays fast.",
        "Heat a pan or pot, then cook the ingredients that need the most time before adding quick-cooking items.",
        "Season in layers and add any sauce, stock, or finishing ingredient once the base tastes good.",
        "Taste, adjust, and serve while the texture still feels lively and not overworked.",
    ]


def _ensure_recipe_steps(suggestion: ChatRecipeSuggestion) -> ChatRecipeSuggestion:
    steps = [step.strip() for step in suggestion.steps if step.strip()]
    if len(steps) >= RECIPE_STEP_MIN:
        return suggestion.model_copy(update={"steps": steps})
    return suggestion.model_copy(update={"steps": _fallback_steps_for_suggestion(suggestion)})


def _normalize_suggestions(suggestions: Iterable[ChatRecipeSuggestion]) -> list[ChatRecipeSuggestion]:
    return [_ensure_recipe_steps(suggestion) for suggestion in _unique_suggestions(suggestions)]


def _build_resilient_reply(request: ChatbotMessageRequest) -> str:
    ingredient_names = _ingredient_names(request)
    if ingredient_names:
        joined = ", ".join(ingredient_names[:4])
        return (
            f"You can absolutely make dinner happen from {joined}. "
            "I pulled together the strongest low-friction ideas first so you can pick a lane fast."
        )
    return (
        "You can still get to dinner from here. "
        "I lined up practical recipes that work even when the fridge context is thin."
    )


def _build_resilient_tips(request: ChatbotMessageRequest) -> list[str]:
    lowered = {name.lower() for name in _ingredient_names(request)}
    tips = [
        "Start with the ingredient that needs using up first, then build the rest of the meal around it.",
        "Lean on one-pan or one-pot formats when the goal is speed, not culinary theater.",
        "Finish with acid, herbs, or chili so simple ingredients still taste intentional.",
    ]
    if "tomato" in lowered or "tomatoes" in lowered:
        tips[0] = "Tomatoes get sweeter and more useful once they hit heat, salt, and a little fat."
    return tips


def _build_fallback_suggestions(request: ChatbotMessageRequest) -> list[ChatRecipeSuggestion]:
    ingredient_names = _ingredient_names(request)
    lowered = {name.lower() for name in ingredient_names}
    suggestions: list[ChatRecipeSuggestion] = []

    if {"tomato", "tomatoes"} & lowered:
        suggestions.extend(
            [
                ChatRecipeSuggestion(
                    title="Blistered Tomato Toast",
                    reason="Fast, cheap, and surprisingly dinner-worthy when tomatoes are doing most of the work.",
                    cook_time="12 min",
                    ingredients=["Tomato", "Bread", "Olive oil", "Garlic"],
                ),
                ChatRecipeSuggestion(
                    title="Quick Tomato Pasta",
                    reason="A hot pan and a little pasta water can turn tomatoes into a proper sauce quickly.",
                    cook_time="18 min",
                    ingredients=["Tomato", "Pasta", "Garlic", "Olive oil"],
                ),
                ChatRecipeSuggestion(
                    title="Tomato Egg Skillet",
                    reason="One of the easiest ways to make tomatoes feel like a full meal instead of a side note.",
                    cook_time="14 min",
                    ingredients=["Tomato", "Eggs", "Garlic", "Bread or rice"],
                ),
                ChatRecipeSuggestion(
                    title="Fast Roasted Tomato Bowl",
                    reason="Roasting concentrates flavor fast and gives you a base for grain bowls, toast, or pasta.",
                    cook_time="20 min",
                    ingredients=["Tomato", "Olive oil", "Salt", "Any grain or toast"],
                ),
            ]
        )

    if {"egg", "eggs"} & lowered:
        suggestions.append(
            ChatRecipeSuggestion(
                title="Soft Scramble Bowl",
                reason="Eggs cook fast and play nicely with almost any vegetable you already have.",
                cook_time="10 min",
                ingredients=["Eggs", "Any vegetables", "Toast or rice"],
            )
        )

    if {"tomato", "spinach"} <= lowered:
        suggestions.append(
            ChatRecipeSuggestion(
                title="Warm Tomato Skillet",
                reason="A quick one-pan dinner that uses delicate produce before it fades.",
                cook_time="15 min",
                ingredients=["Tomato", "Spinach", "Garlic", "Olive oil"],
            )
        )

    if {"chicken breast", "rice"} <= lowered:
        suggestions.append(
            ChatRecipeSuggestion(
                title="Lemon Chicken Rice Bowl",
                reason="Reliable, balanced, and easy to pull off on a weeknight.",
                cook_time="22 min",
                ingredients=["Chicken Breast", "Rice", "Broccoli", "Lemon"],
            )
        )

    generic_templates = [
        (
            "Fridge Sweep Stir-Fry",
            "The safest move when you want dinner fast and the fridge is a little chaotic.",
            "18 min",
            ("Any vegetables", "Any protein", "Rice or noodles", "Soy sauce"),
        ),
        (
            "Sheet Pan Dinner Mix",
            "Throwing everything onto one tray keeps cleanup low and dinner honest.",
            "25 min",
            ("Any vegetables", "Protein", "Olive oil", "Garlic"),
        ),
        (
            "Cozy Soup Pot",
            "A broth-based soup is forgiving and lets you stretch random ingredients well.",
            "28 min",
            ("Any vegetables", "Stock", "Beans or protein", "Herbs"),
        ),
        (
            "Loaded Grain Bowl",
            "Good when you want structure without committing to one cuisine.",
            "20 min",
            ("Rice or quinoa", "Vegetables", "Protein", "Sauce"),
        ),
        (
            "Skillet Fried Rice",
            "Excellent for leftovers and very hard to mess up once the pan is hot.",
            "16 min",
            ("Rice", "Eggs or protein", "Vegetables", "Soy sauce"),
        ),
        (
            "Quick Pasta Toss",
            "A fast sauce and a few sharp toppings can make the fridge feel richer than it is.",
            "17 min",
            ("Pasta", "Vegetables", "Cheese or protein", "Garlic"),
        ),
        (
            "Folded Quesadilla Stack",
            "Cheese plus something crisp and something savory gets you a fast comfort dinner.",
            "12 min",
            ("Tortillas", "Cheese", "Vegetables", "Protein"),
        ),
        (
            "Crunchy Salad Plate",
            "When the fridge is produce-heavy, a big composed salad keeps things fresh instead of sleepy.",
            "14 min",
            ("Greens", "Vegetables", "Protein", "Bright dressing"),
        ),
        (
            "Any-Veg Frittata",
            "A frittata is a smart landing spot for bits and pieces that need using up.",
            "22 min",
            ("Eggs", "Vegetables", "Cheese", "Herbs"),
        ),
        (
            "Quick Curry Pan",
            "A pantry curry base can make random vegetables taste intentional fast.",
            "24 min",
            ("Vegetables", "Protein", "Coconut milk or yogurt", "Curry paste"),
        ),
        (
            "Toast Night Upgrade",
            "Pile the right toppings onto good toast and dinner suddenly feels efficient, not lazy.",
            "10 min",
            ("Bread", "Vegetables", "Cheese or eggs", "Acid or herbs"),
        ),
        (
            "Brothy Noodle Bowl",
            "Perfect when you want something warm, slurpable, and forgiving.",
            "18 min",
            ("Noodles", "Vegetables", "Protein", "Stock"),
        ),
        (
            "Stuffed Wrap Roll-Up",
            "Wraps are great when you need a portable meal from small leftover amounts.",
            "11 min",
            ("Wraps", "Protein", "Vegetables", "Sauce"),
        ),
        (
            "Roasted Veg Tacos",
            "Tacos hide a lot of fridge randomness in a very charming way.",
            "20 min",
            ("Tortillas", "Vegetables", "Beans or protein", "Lime"),
        ),
        (
            "Savory Yogurt Bowl",
            "A cool bowl with herbs and crunchy toppings works surprisingly well for a light meal.",
            "9 min",
            ("Yogurt", "Vegetables", "Herbs", "Toasted seeds"),
        ),
    ]

    for title, reason, cook_time, fallbacks in generic_templates:
        suggestions.append(
            ChatRecipeSuggestion(
                title=title,
                reason=reason,
                cook_time=cook_time,
                ingredients=_recipe_ingredients(ingredient_names, *fallbacks),
            )
        )

    if not suggestions:
        message_lower = request.message.lower()
        title = "Quick Pantry Bowl" if any(word in message_lower for word in ("quick", "fast", "easy")) else "Anything-Goes Skillet"
        suggestions.append(
            ChatRecipeSuggestion(
                title=title,
                reason="A flexible base recipe keeps the app useful even when the fridge context is thin.",
                cook_time="15 min",
                ingredients=["Rice or toast", "Any vegetables", "Any protein", "Sauce or seasoning"],
            )
        )

    unique_suggestions = _normalize_suggestions(suggestions)
    return unique_suggestions[:TARGET_RECIPE_MAX]


def _normalize_chatbot_payload(payload: dict, request: ChatbotMessageRequest) -> ChatbotMessageResponse:
    raw_suggestions = payload.get("suggestedRecipes", payload.get("suggested_recipes", []))
    raw_tips = payload.get("tips", [])
    suggestions = raw_suggestions if isinstance(raw_suggestions, list) else []
    tips = raw_tips if isinstance(raw_tips, list) else []

    normalized_suggestions: list[ChatRecipeSuggestion] = []
    for suggestion in suggestions:
        if not isinstance(suggestion, dict):
            continue

        ingredients = [
            _truncate_text(ingredient, 40)
            for ingredient in suggestion.get("ingredients", [])
            if str(ingredient).strip()
        ][:MAX_RECIPE_LIST_ITEMS]

        steps = [
            _truncate_text(step, MAX_STEP_LENGTH)
            for step in suggestion.get("steps", [])
            if str(step).strip()
        ][:RECIPE_STEP_MIN]

        title = _truncate_text(suggestion.get("title"), MAX_TITLE_LENGTH)
        reason = _truncate_text(
            suggestion.get("reason"),
            MAX_REASON_LENGTH,
            "A practical dinner move built from what you already have.",
        )
        cook_time = _truncate_text(
            suggestion.get("cookTime", suggestion.get("cook_time")),
            MAX_COOK_TIME_LENGTH,
            "15 min",
        )

        if not title:
            continue

        normalized_suggestions.append(
            ChatRecipeSuggestion(
                title=title,
                reason=reason,
                cook_time=cook_time,
                ingredients=ingredients,
                steps=steps,
            )
        )

    response = ChatbotMessageResponse(
        reply=_truncate_text(
            payload.get("reply"),
            500,
            "Dinner wisdom incoming, just with less drama than expected.",
        ),
        suggested_recipes=normalized_suggestions,
        tips=[_truncate_text(tip, 120) for tip in tips if str(tip).strip()][:3],
    )

    fallback_suggestions = _build_fallback_suggestions(request)

    if len(response.suggested_recipes) >= TARGET_RECIPE_MIN:
        return ChatbotMessageResponse(
            reply=response.reply,
            suggested_recipes=_normalize_suggestions(response.suggested_recipes)[:TARGET_RECIPE_MAX],
            tips=response.tips,
        )

    merged_suggestions = _normalize_suggestions([*response.suggested_recipes, *fallback_suggestions])

    return ChatbotMessageResponse(
        reply=response.reply,
        suggested_recipes=merged_suggestions[:TARGET_RECIPE_MAX],
        tips=response.tips,
    )


def generate_chatbot_reply(request: ChatbotMessageRequest) -> ChatbotMessageResponse:
    settings = get_settings()

    if not settings.gemini_api_key:
        raise RuntimeError("Gemini is not configured. Set GEMINI_API_KEY.")

    if _should_use_fast_path(request):
        return ChatbotMessageResponse(
            reply=_build_resilient_reply(request),
            suggested_recipes=_build_fallback_suggestions(request),
            tips=_build_resilient_tips(request),
        )

    prompt = build_chatbot_prompt(
        message=request.message,
        fridge_items=request.fridge_items,
        history=request.history,
        profile=request.profile,
        max_history=settings.chatbot_max_history,
    )

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            generation_config={
                "temperature": 0.55,
                "max_output_tokens": 1400,
                "response_mime_type": "application/json",
            },
        )
        response = model.generate_content(
            prompt,
            request_options={"timeout": settings.gemini_timeout_seconds},
        )
        payload = json.loads(_strip_json_fence(response.text))
        return _normalize_chatbot_payload(payload, request)
    except Exception as exc:
        logger.warning("Gemini request failed: %s", exc)
        return ChatbotMessageResponse(
            reply=_build_resilient_reply(request),
            suggested_recipes=_build_fallback_suggestions(request),
            tips=_build_resilient_tips(request),
        )
