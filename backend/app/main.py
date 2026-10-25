from __future__ import annotations

import json
from datetime import date
from typing import Any
from uuid import UUID

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    supabase_url: str = ""
    supabase_key: str = ""
    frontend_origin: str = "http://localhost:5173"


settings = Settings()
app = FastAPI(title="Personalized Travel Itinerary Planner", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


class TripRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=100)
    start_date: date
    end_date: date
    budget: float = Field(gt=0, le=10_000_000)
    currency: str = Field(default="USD", pattern=r"^[A-Z]{3}$")
    interests: list[str] = Field(min_length=1, max_length=10)
    travel_style: str = Field(min_length=2, max_length=80)
    travellers: int = Field(ge=1, le=20)

    @model_validator(mode="after")
    def dates_are_ordered(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after start date")
        if (self.end_date - self.start_date).days > 30:
            raise ValueError("Trips are limited to 31 itinerary days")
        return self


class Day(BaseModel):
    date: date
    title: str
    activities: list[dict[str, str]]
    food: str
    transport: str
    accommodation: str
    estimated_cost: float = Field(ge=0)


class Itinerary(BaseModel):
    destination: str
    currency: str
    days: list[Day]
    estimated_total: float
    cost_breakdown: dict[str, float]
    source: str


class DayEdit(BaseModel):
    day: Day


def fallback_itinerary(trip: TripRequest) -> Itinerary:
    count = (trip.end_date - trip.start_date).days + 1
    per_day = round(trip.budget / count, 2)
    days = []
    for i in range(count):
        day_date = date.fromordinal(trip.start_date.toordinal() + i)
        interest = trip.interests[i % len(trip.interests)]
        days.append(Day(
            date=day_date,
            title=f"Day {i + 1}: Explore {trip.destination}",
            activities=[
                {"time": "09:00", "name": f"{interest.title()} discovery", "description": f"Choose a well-reviewed {interest} experience in {trip.destination}; confirm opening hours before setting out."},
                {"time": "13:00", "name": "Local neighborhood break", "description": "Explore a walkable nearby district and leave time for a relaxed lunch."},
                {"time": "16:00", "name": "Flexible afternoon", "description": "Visit a nearby landmark or take a rest break based on your energy and budget."},
            ],
            food=f"Try a popular local restaurant that fits your {trip.travel_style.lower()} style; check current menus and dietary options.",
            transport="Use local public transit or walk where practical; check routes and fares on the day.",
            accommodation="Choose a well-reviewed stay near the day's activities and within your total budget.",
            estimated_cost=per_day,
        ))
    return Itinerary(
        destination=trip.destination, currency=trip.currency, days=days,
        estimated_total=round(per_day * count, 2),
        cost_breakdown={"activities": round(per_day * .35, 2), "food": round(per_day * .25, 2), "transport": round(per_day * .15, 2), "accommodation": round(per_day * .25, 2)},
        source="fallback",
    )


async def generate_itinerary(trip: TripRequest) -> Itinerary:
    if not settings.gemini_api_key:
        return fallback_itinerary(trip)
    prompt = (
        "Create a practical travel itinerary as JSON only, with keys destination,currency,days,estimated_total,cost_breakdown. "
        "Each day has date,title,activities (array of {time,name,description}),food,transport,accommodation,estimated_cost. "
        "Use estimates, no invented live availability. Do not exceed the trip budget. Input: " + trip.model_dump_json()
    )
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"
    try:
        async with httpx.AsyncClient(timeout=35) as client:
            response = await client.post(url, headers={"x-goog-api-key": settings.gemini_api_key}, json={"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json"}})
        response.raise_for_status()
        raw = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        result = Itinerary.model_validate(json.loads(raw))
        result.source = "gemini"
        return result
    except (httpx.HTTPError, KeyError, IndexError, ValueError, TypeError):
        result = fallback_itinerary(trip)
        result.source = "fallback"
        return result


def require_user_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sign in to manage saved trips")
    return authorization.split(" ", 1)[1]


async def supabase_request(method: str, path: str, token: str, payload: Any = None) -> Any:
    if not settings.supabase_url or not settings.supabase_key:
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    headers = {"apikey": settings.supabase_key, "Authorization": f"Bearer {token}", "Content-Type": "application/json", "Prefer": "return=representation"}
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.request(method, f"{settings.supabase_url.rstrip('/')}/rest/v1/{path}", headers=headers, json=payload)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Supabase request failed; check the schema and your signed-in account")
    return response.json() if response.content else None


@app.get("/api/health")
async def health():
    return {"status": "ok", "gemini_configured": bool(settings.gemini_api_key), "supabase_configured": bool(settings.supabase_url and settings.supabase_key)}


@app.post("/api/itineraries/generate", response_model=Itinerary)
async def create_itinerary(trip: TripRequest):
    return await generate_itinerary(trip)


@app.post("/api/itineraries/regenerate-day", response_model=Day)
async def regenerate_day(payload: dict[str, Any]):
    trip = TripRequest.model_validate(payload.get("trip", {}))
    index = int(payload.get("day_index", -1))
    itinerary = await generate_itinerary(trip)
    if index < 0 or index >= len(itinerary.days):
        raise HTTPException(status_code=422, detail="day_index is outside this trip")
    return itinerary.days[index]


@app.get("/api/trips")
async def list_trips(token: str = Depends(require_user_token)):
    return await supabase_request("GET", "saved_trips?select=*&order=updated_at.desc", token)


@app.post("/api/trips")
async def save_trip(payload: dict[str, Any], token: str = Depends(require_user_token)):
    return await supabase_request("POST", "saved_trips", token, payload)


@app.patch("/api/trips/{trip_id}")
async def update_trip(trip_id: UUID, payload: dict[str, Any], token: str = Depends(require_user_token)):
    return await supabase_request("PATCH", f"saved_trips?id=eq.{trip_id}", token, payload)


@app.delete("/api/trips/{trip_id}")
async def delete_trip(trip_id: UUID, token: str = Depends(require_user_token)):
    return await supabase_request("DELETE", f"saved_trips?id=eq.{trip_id}", token)
