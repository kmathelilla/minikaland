from fastapi import HTTPException, Response
from pydantic import ValidationError
from google.genai.errors import APIError

from .gemini_service import generate_structured_json, get_api_key
from .pdf_renderer import adventure_filename, build_adventure_sheet_pdf
from .prompts import (
    build_adventure_sheet_prompt,
    build_evaluation_prompt,
)
from .schemas import (
    ActivityEvaluationResponse,
    AdventureSheetBonus,
    AdventureSheetRequest,
    GeneratedActivityContext,
)


def evaluate_activity(
    activity: GeneratedActivityContext,
) -> ActivityEvaluationResponse:
    api_key = get_api_key()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="A fejlesztési becslés jelenleg nem érhető el.",
        )

    try:
        response_text = generate_structured_json(
            api_key,
            build_evaluation_prompt(activity),
            ActivityEvaluationResponse,
            operation="development-evaluation",
        )
    except APIError as error:
        raise HTTPException(
            status_code=502,
            detail="A fejlesztési becslés nem sikerült.",
        ) from error

    try:
        if not response_text:
            raise ValueError("Gemini returned an empty response.")
        return ActivityEvaluationResponse.model_validate_json(response_text)
    except (ValidationError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail="A fejlesztési becslés válasza érvénytelen.",
        ) from error


def create_adventure_sheet(activity: AdventureSheetRequest) -> Response:
    api_key = get_api_key()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="A kalandlap készítése jelenleg nem érhető el.",
        )

    try:
        response_text = generate_structured_json(
            api_key,
            build_adventure_sheet_prompt(activity, activity.safety),
            AdventureSheetBonus,
            operation="adventure-sheet",
        )
    except APIError as error:
        raise HTTPException(
            status_code=502,
            detail="A kalandlap megtervezése nem sikerült.",
        ) from error

    try:
        if not response_text:
            raise ValueError("Gemini returned an empty response.")
        bonus = AdventureSheetBonus.model_validate_json(response_text)
    except (ValidationError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail="A kalandlap terve érvénytelen.",
        ) from error

    pdf_bytes = build_adventure_sheet_pdf(activity, bonus)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{adventure_filename(activity.title)}"'
            )
        },
    )
