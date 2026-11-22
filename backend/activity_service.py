from difflib import SequenceMatcher
import re

from fastapi import HTTPException
from pydantic import ValidationError
from google.genai.errors import APIError

from .gemini_service import generate_structured_json, get_api_key
from .prompts import build_activity_prompt
from .schemas import ActivityContent, ActivityRequest, ActivityResponse


def create_activity(request: ActivityRequest) -> ActivityResponse:
    api_key = get_api_key()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="A tevékenységgenerálás jelenleg nem érhető el.",
        )

    try:
        response_text = generate_structured_json(
            api_key,
            build_activity_prompt(request),
            ActivityContent,
            operation="activity",
        )
    except APIError as error:
        raise HTTPException(
            status_code=502,
            detail="A tevékenység generálása nem sikerült.",
        ) from error

    try:
        if not response_text:
            raise ValueError("Gemini returned an empty response.")
        content = ActivityContent.model_validate_json(response_text)
    except (ValidationError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail="A generált tevékenység válasza érvénytelen.",
        ) from error

    subtitle = content.subtitle
    if _is_duplicate_subtitle(content.title, subtitle):
        subtitle = None

    return ActivityResponse(
        title=content.title,
        subtitle=subtitle,
        materials=content.materials,
        steps=content.steps,
        safety=content.safety,
        age=request.age,
        duration=request.duration,
        skills=request.skills,
    )


def _is_duplicate_subtitle(title: str, subtitle: str | None) -> bool:
    if not subtitle:
        return True

    normalize = lambda value: re.sub(r"[\W_]+", " ", value.casefold()).strip()
    normalized_title = normalize(title)
    normalized_subtitle = normalize(subtitle)
    if not normalized_title or not normalized_subtitle:
        return True

    smaller, larger = sorted(
        (normalized_title, normalized_subtitle),
        key=len,
    )
    return (
        smaller == larger
        or (len(smaller) >= 8 and smaller in larger)
        or SequenceMatcher(
            None,
            normalized_title,
            normalized_subtitle,
        ).ratio()
        >= 0.82
    )
