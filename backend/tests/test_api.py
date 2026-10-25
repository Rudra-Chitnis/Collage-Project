from datetime import date, timedelta

import pytest

from fastapi import HTTPException
from backend.app.main import TripRequest, app, create_itinerary, fallback_itinerary, health, require_user_token


def sample_trip():
    start = date.today() + timedelta(days=10)
    return {"destination": "Lisbon", "start_date": start.isoformat(), "end_date": (start + timedelta(days=1)).isoformat(), "budget": 500, "currency": "EUR", "interests": ["food", "history"], "travel_style": "relaxed", "travellers": 2}


def run_without_io(coroutine):
    try:
        coroutine.send(None)
    except StopIteration as result:
        return result.value
    raise AssertionError("Expected this handler to complete without I/O")


def test_health_handler():
    assert run_without_io(health())["status"] == "ok"


def test_generate_handler_uses_labeled_fallback_when_unconfigured(monkeypatch):
    monkeypatch.setattr("backend.app.main.settings.gemini_api_key", "")
    response = run_without_io(create_itinerary(TripRequest.model_validate(sample_trip())))
    assert response.source == "fallback"
    assert len(response.days) == 2
    assert response.days[0].transport


def test_invalid_trip_dates_rejected():
    trip = sample_trip()
    trip["end_date"] = trip["start_date"]
    trip["start_date"] = (date.fromisoformat(trip["end_date"]) + timedelta(days=1)).isoformat()
    with pytest.raises(ValueError):
        TripRequest.model_validate(trip)


def test_saved_trips_require_authentication():
    with pytest.raises(HTTPException) as exc:
        require_user_token(None)
    assert exc.value.status_code == 401


def test_cors_allows_local_vite_origins():
    cors = next(middleware for middleware in app.user_middleware if middleware.cls.__name__ == "CORSMiddleware")
    assert "http://localhost:5173" in cors.kwargs["allow_origins"]
    assert "http://127.0.0.1:5173" in cors.kwargs["allow_origins"]


def test_fallback_budget_estimates():
    result = fallback_itinerary(TripRequest.model_validate(sample_trip()))
    assert result.estimated_total <= 500
    assert result.source == "fallback"
    assert result.notice
