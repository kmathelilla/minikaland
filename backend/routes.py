from fastapi import APIRouter, Response

from .activity_service import create_activity
from .schemas import (
    ActivityEvaluationResponse,
    ActivityRequest,
    ActivityResponse,
    AdventureSheetRequest,
    GeneratedActivityContext,
)
from .tools import create_adventure_sheet, evaluate_activity


router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/jatek", response_model=ActivityResponse)
def create_activity_route(request: ActivityRequest) -> ActivityResponse:
    return create_activity(request)


@router.post(
    "/jatek/ertekeles",
    response_model=ActivityEvaluationResponse,
)
def evaluate_activity_route(
    activity: GeneratedActivityContext,
) -> ActivityEvaluationResponse:
    return evaluate_activity(activity)


@router.post(
    "/jatek/kalandlap",
    response_class=Response,
    responses={
        200: {
            "description": "Nyomtatható A4 kalandlap PDF.",
            "content": {
                "application/pdf": {
                    "schema": {"type": "string", "format": "binary"}
                }
            },
        }
    },
)
def generate_adventure_sheet_route(
    activity: AdventureSheetRequest,
) -> Response:
    return create_adventure_sheet(activity)
