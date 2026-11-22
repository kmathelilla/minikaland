import logging
import os
import re
import time

from google import genai
from google.genai.errors import APIError
from pydantic import BaseModel


MODEL_NAME = "gemini-3.5-flash-lite"
FALLBACK_MODEL_NAME = "gemini-3.6-flash"
MAX_ATTEMPTS = 3
RETRY_DELAYS_SECONDS = (0.5, 1.0)
logger = logging.getLogger(__name__)


def get_api_key() -> str | None:
    return os.getenv("GEMINI_API_KEY")


def _safe_error_message(error: APIError) -> str:
    message = str(error.message or "")
    message = re.sub(r"AIza[0-9A-Za-z_-]{20,}", "[REDACTED]", message)
    message = re.sub(
        r"(?i)(api[_ -]?key|key)(\s*[:=]\s*)[^,\s]+",
        r"\1\2[REDACTED]",
        message,
    )
    return message[:400]


def generate_structured_json(
    api_key: str,
    prompt: str,
    response_schema: type[BaseModel],
    operation: str,
) -> str | None:
    started_at = time.perf_counter()
    total_attempts = 0
    models = (
        (MODEL_NAME, MAX_ATTEMPTS),
        (FALLBACK_MODEL_NAME, 1),
    )

    for model_index, (model_name, max_attempts) in enumerate(models):
        for attempt in range(1, max_attempts + 1):
            total_attempts += 1
            try:
                with genai.Client(api_key=api_key) as client:
                    result = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config={
                            "response_mime_type": "application/json",
                            "response_schema": response_schema,
                        },
                    )
            except APIError as error:
                elapsed_ms = round((time.perf_counter() - started_at) * 1000)
                is_unavailable = (
                    error.code == 503
                    and error.status == "UNAVAILABLE"
                )
                if is_unavailable and attempt < max_attempts:
                    logger.warning(
                        "Gemini request temporarily unavailable "
                        "operation=%s model=%s status_code=%s "
                        "retry_attempt=%s/%s duration_ms=%s",
                        operation,
                        model_name,
                        error.code,
                        attempt,
                        max_attempts - 1,
                        elapsed_ms,
                    )
                    time.sleep(RETRY_DELAYS_SECONDS[attempt - 1])
                    continue

                if is_unavailable and model_index == 0:
                    logger.warning(
                        "Gemini primary model exhausted retries "
                        "operation=%s model=%s status_code=%s "
                        "attempts=%s fallback_model=%s duration_ms=%s",
                        operation,
                        model_name,
                        error.code,
                        attempt,
                        FALLBACK_MODEL_NAME,
                        elapsed_ms,
                    )
                    break

                logger.error(
                    "Gemini request failed operation=%s model=%s "
                    "exception_type=%s status_code=%s status=%s "
                    "retry_attempts=%s attempts=%s duration_ms=%s message=%s",
                    operation,
                    model_name,
                    type(error).__name__,
                    error.code,
                    error.status,
                    total_attempts - 1,
                    total_attempts,
                    elapsed_ms,
                    _safe_error_message(error),
                )
                raise

            elapsed_ms = round((time.perf_counter() - started_at) * 1000)
            logger.info(
                "Gemini request succeeded operation=%s model=%s "
                "status_code=200 retry_attempts=%s attempts=%s "
                "fallback_used=%s duration_ms=%s",
                operation,
                model_name,
                total_attempts - 1,
                total_attempts,
                model_index > 0,
                elapsed_ms,
            )
            return result.text

    raise RuntimeError("Gemini retry loop ended without a response.")
