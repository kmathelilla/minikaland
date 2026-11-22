import json
from pathlib import Path

from dotenv import load_dotenv

from .gemini_service import MODEL_NAME, generate_structured_json, get_api_key
from .prompts import build_activity_prompt
from .schemas import ActivityContent, ActivityRequest


def main() -> None:
    load_dotenv(Path(__file__).with_name(".env"))
    api_key = get_api_key()
    if not api_key:
        raise RuntimeError("Set GEMINI_API_KEY in backend/.env first.")

    request = ActivityRequest(
        age=4,
        duration=20,
        theme="erdő",
        skills=["kreativ"],
    )
    response_text = generate_structured_json(
        api_key,
        build_activity_prompt(request),
        ActivityContent,
        operation="manual-smoke-test",
    )
    if not response_text:
        raise RuntimeError("Gemini returned an empty response.")

    activity = ActivityContent.model_validate_json(response_text)
    print(json.dumps(activity.model_dump(), ensure_ascii=False, indent=2))
    print(f"Model: {MODEL_NAME}")


if __name__ == "__main__":
    main()
