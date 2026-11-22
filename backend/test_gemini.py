import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).with_name(".env"))

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("Hiányzik a GEMINI_API_KEY a .env fájlból.")

with genai.Client(api_key=api_key) as client:
    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=(
            "Adj egy kreatív, biztonságos, otthon játszható "
            "játékötletet egy 4 éves gyereknek, 20 percre. "
            "Írd le magyarul a játék nevét, eszközeit és "
            "3 egyszerű lépését."
        ),
    )

print(response.text)