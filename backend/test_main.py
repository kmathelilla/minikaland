import json
from types import SimpleNamespace

from fastapi.testclient import TestClient

from backend import main


client = TestClient(main.app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_activity_uses_gemini_and_returns_structured_response(
    monkeypatch,
):
    activity = {
        "title": "Színek felfedezése",
        "materials": ["színes papír", "nagy tál"],
        "steps": ["Válassz papírokat.", "Csoportosítsd őket.", "Mesélj a színekről."],
    }
    calls = {}

    class FakeModels:
        def generate_content(self, **kwargs):
            calls.update(kwargs)
            return SimpleNamespace(text=json.dumps(activity, ensure_ascii=False))

    class FakeClient:
        def __init__(self, *, api_key):
            calls["api_key"] = api_key
            self.models = FakeModels()

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(main.genai, "Client", FakeClient)

    response = client.post(
        "/jatek",
        json={"age": 4, "duration": 20, "theme": "színek"},
    )

    assert response.status_code == 200
    assert response.json() == activity
    assert calls["api_key"] == "test-key"
    assert calls["model"] == main.MODEL_NAME
    assert calls["config"]["response_mime_type"] == "application/json"
    assert calls["config"]["response_schema"] is main.ActivityResponse
    assert "Kor: 4 év." in calls["contents"]
    assert "Időtartam: 20 perc." in calls["contents"]
    assert "Téma: színek." in calls["contents"]


def test_create_activity_rejects_out_of_range_input():
    response = client.post(
        "/jatek",
        json={"age": 13, "duration": 4, "theme": "állatok"},
    )

    assert response.status_code == 422


def test_create_activity_rejects_blank_theme():
    response = client.post(
        "/jatek",
        json={"age": 6, "duration": 20, "theme": "   "},
    )

    assert response.status_code == 422


def test_create_activity_returns_gateway_error_for_invalid_gemini_response(
    monkeypatch,
):
    class FakeModels:
        def generate_content(self, **kwargs):
            return SimpleNamespace(
                text='{"title":"Játék","materials":["papír"],"steps":["Csak egy lépés"]}'
            )

    class FakeClient:
        def __init__(self, *, api_key):
            self.models = FakeModels()

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(main.genai, "Client", FakeClient)

    response = client.post(
        "/jatek",
        json={"age": 6, "duration": 20, "theme": "erdő"},
    )

    assert response.status_code == 502
    assert response.json() == {
        "detail": "A generált tevékenység válasza érvénytelen."
    }


def test_create_activity_reports_missing_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    response = client.post(
        "/jatek",
        json={"age": 6, "duration": 20, "theme": "erdő"},
    )

    assert response.status_code == 503
