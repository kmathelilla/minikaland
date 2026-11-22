import json
import re
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from backend import main


client = TestClient(main.app)

ACTIVITY_CONTEXT = {
    "title": "Színek felfedezése",
    "description": "Válogassatok színeket egy vidám kis mentőakcióban.",
    "materials": ["színes papír", "nagy tál"],
    "steps": [
        "Válassz papírokat.",
        "Csoportosítsd őket.",
        "Mesélj a színekről.",
    ],
    "age": 4,
    "duration": 20,
    "skills": ["kreativ"],
    "safety": "Vágásnál és apró tárgyaknál felnőtt segítsége szükséges.",
}

ADVENTURE_SHEET_BONUS = {
    "title": "Színvarázs",
    "prompt": "Válasszatok ki három kék tárgyat, és rendezzétek őket sorba.",
    "twist": "Most cseréljetek helyet csukott szemmel, és találjátok ki, mi változott.",
    "symbol": "circle",
}


class ManagedFakeClient:
    def __init__(self):
        self.state = {"closed": False}

    @property
    def closed(self):
        return self.state["closed"]

    def __enter__(self):
        if self.closed:
            raise RuntimeError("Cannot send a request, as the client has been closed.")
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.state["closed"] = True

    def __del__(self):
        self.state["closed"] = True


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_adventure_sheet_endpoint_is_in_openapi_and_image_endpoint_is_removed():
    response = client.get("/openapi.json")
    paths = response.json()["paths"]

    assert response.status_code == 200
    assert "post" in paths["/jatek/kalandlap"]
    assert "application/pdf" in paths["/jatek/kalandlap"]["post"]["responses"]["200"]["content"]
    assert "/jatek/kep" not in paths


def test_generate_adventure_sheet_returns_pdf_with_embedded_font(monkeypatch):
    calls = {}
    client_states = []

    class FakeModels:
        def __init__(self, client_state):
            self.client_state = client_state

        def generate_content(self, **kwargs):
            if self.client_state["closed"]:
                raise RuntimeError(
                    "Cannot send a request, as the client has been closed."
                )
            calls.update(kwargs)
            return SimpleNamespace(text=json.dumps(ADVENTURE_SHEET_BONUS))

    class FakeClient(ManagedFakeClient):
        def __init__(self, *, api_key):
            super().__init__()
            calls["api_key"] = api_key
            self.models = FakeModels(self.state)
            client_states.append(self.state)

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(main.genai, "Client", FakeClient)

    responses = [
        client.post("/jatek/kalandlap", json=ACTIVITY_CONTEXT)
        for _ in range(2)
    ]
    response = responses[0]

    assert response.status_code == 200
    assert responses[1].status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["content-disposition"] == (
        'attachment; filename="kalandlap-szinek-felfedezese.pdf"'
    )
    assert response.content.startswith(b"%PDF-")
    assert b"/FontFile2" in response.content
    assert len(re.findall(rb"/Type\s+/Page\b", response.content)) == 1
    assert calls["api_key"] == "test-key"
    assert calls["model"] == main.MODEL_NAME
    assert calls["config"]["response_schema"] is main.AdventureSheetBonus
    assert set(main.AdventureSheetBonus.model_fields) == {
        "title",
        "prompt",
        "twist",
        "symbol",
    }
    assert "Színek felfedezése" in calls["contents"]
    assert "színes papír" in calls["contents"]
    assert "EGYETLEN" in calls["contents"]
    assert len(client_states) == 2
    assert all(state["closed"] for state in client_states)


def test_generate_adventure_sheet_rejects_invalid_bonus(monkeypatch):
    class FakeModels:
        def generate_content(self, **kwargs):
            return SimpleNamespace(
                text=json.dumps(
                    {
                        **ADVENTURE_SHEET_BONUS,
                        "symbol": "rocket",
                    }
                )
            )

    class FakeClient(ManagedFakeClient):
        def __init__(self, *, api_key):
            super().__init__()
            self.models = FakeModels()

    clients = []
    original_client = FakeClient

    def tracked_client(*, api_key):
        instance = original_client(api_key=api_key)
        clients.append(instance)
        return instance

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(main.genai, "Client", tracked_client)

    response = client.post(
        "/jatek/kalandlap",
        json=ACTIVITY_CONTEXT,
    )

    assert response.status_code == 502
    assert response.json() == {"detail": "A kalandlap terve érvénytelen."}
    assert len(clients) == 1
    assert clients[0].closed


def test_generate_adventure_sheet_closes_client_when_gemini_fails(monkeypatch):
    class FakeModels:
        def generate_content(self, **kwargs):
            raise main.APIError(503, {"error": {"status": "UNAVAILABLE"}})

    clients = []

    class FakeClient(ManagedFakeClient):
        def __init__(self, *, api_key):
            super().__init__()
            self.models = FakeModels()
            clients.append(self)

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(main.genai, "Client", FakeClient)

    response = client.post(
        "/jatek/kalandlap",
        json=ACTIVITY_CONTEXT,
    )

    assert response.status_code == 502
    assert clients[0].closed


def test_create_activity_uses_gemini_and_returns_structured_response(
    monkeypatch,
):
    activity = {
        "title": "Színek felfedezése",
        "subtitle": "Vidám válogatás hétköznapi tárgyakkal",
        "materials": ["színes papír", "nagy tál"],
        "steps": ["Válassz papírokat.", "Csoportosítsd őket.", "Mesélj a színekről."],
        "safety": "Apró tárgyaknál maradjon felnőtt a gyermek mellett.",
    }
    model_calls = []
    calls = {}

    class FakeModels:
        def generate_content(self, **kwargs):
            model_calls.append(kwargs)
            return SimpleNamespace(
                text=json.dumps(activity, ensure_ascii=False)
            )

    class FakeClient(ManagedFakeClient):
        def __init__(self, *, api_key):
            super().__init__()
            calls["api_key"] = api_key
            self.models = FakeModels()

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(main.genai, "Client", FakeClient)

    response = client.post(
        "/jatek",
        json={"age": 4, "duration": 20, "theme": "színek"},
    )

    assert response.status_code == 200
    assert response.json() == {
        **activity,
        "age": 4,
        "duration": 20,
        "skills": [],
    }
    assert len(model_calls) == 1
    assert all(call["model"] == main.MODEL_NAME for call in model_calls)
    assert model_calls[0]["config"]["response_schema"] is main.ActivityContent
    assert model_calls[0]["config"]["response_mime_type"] == "application/json"
    assert "Kor: 4 év." in model_calls[0]["contents"]
    assert "Időtartam: 20 perc." in model_calls[0]["contents"]
    assert "Téma: színek." in model_calls[0]["contents"]
    assert "Ne használj emojikat" in model_calls[0]["contents"]
    assert calls["api_key"] == "test-key"


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

    class FakeClient(ManagedFakeClient):
        def __init__(self, *, api_key):
            super().__init__()
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


def test_evaluate_activity_returns_exactly_three_structured_ratings(
    monkeypatch,
):
    ratings = {
        "areas": [
            {"name": "Színfelismerés", "stars": 3},
            {"name": "Finommotorika", "stars": 2},
            {"name": "Nyelvi készségek", "stars": 1},
        ],
    }
    calls = {}

    class FakeModels:
        def generate_content(self, **kwargs):
            calls.update(kwargs)
            return SimpleNamespace(
                text=json.dumps(ratings, ensure_ascii=False)
            )

    class FakeClient(ManagedFakeClient):
        def __init__(self, *, api_key):
            super().__init__()
            calls["api_key"] = api_key
            self.models = FakeModels()

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(main.genai, "Client", FakeClient)

    response = client.post(
        "/jatek/ertekeles",
        json=ACTIVITY_CONTEXT,
    )

    assert response.status_code == 200
    assert response.json() == ratings
    assert calls["api_key"] == "test-key"
    assert calls["model"] == main.MODEL_NAME
    assert calls["config"]["response_mime_type"] == "application/json"
    assert (
        calls["config"]["response_schema"]
        is main.ActivityEvaluationResponse
    )
    assert "Színek felfedezése" in calls["contents"]
    assert "pontosan három" in calls["contents"]


def test_evaluate_activity_rejects_non_unique_or_incomplete_ratings(
    monkeypatch,
):
    class FakeModels:
        def generate_content(self, **kwargs):
            return SimpleNamespace(
                text=json.dumps(
                    {
                        "areas": [
                            {"name": "Figyelem", "stars": 2},
                            {"name": "Figyelem", "stars": 3},
                        ]
                    }
                )
            )

    class FakeClient(ManagedFakeClient):
        def __init__(self, *, api_key):
            super().__init__()
            self.models = FakeModels()

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(main.genai, "Client", FakeClient)

    response = client.post(
        "/jatek/ertekeles",
        json=ACTIVITY_CONTEXT,
    )

    assert response.status_code == 502
