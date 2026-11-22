import re
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    Field,
    StrictInt,
    field_validator,
    model_validator,
)

from .skills import SkillName


EMOJI_PATTERN = re.compile(
    "[\U0001F000-\U0001FAFF"
    "\U0001FC00-\U0001FFFD"
    "\u2600-\u27BF"
    "\uFE0E\uFE0F\u200D]"
)


class ActivityRequest(BaseModel):
    age: Annotated[int, Field(ge=3, le=12)]
    duration: Annotated[int, Field(ge=5, le=120)]
    theme: Annotated[str, Field(min_length=1, max_length=280)]
    skills: list[SkillName] = Field(default_factory=list)
    previous_titles: list[
        Annotated[str, Field(min_length=1, max_length=160)]
    ] = Field(default_factory=list, max_length=10)

    @field_validator("theme")
    @classmethod
    def theme_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("A téma nem lehet üres.")
        return value

    @field_validator("previous_titles")
    @classmethod
    def previous_titles_must_not_be_blank(
        cls,
        titles: list[str],
    ) -> list[str]:
        titles = [title.strip() for title in titles]
        if any(not title for title in titles):
            raise ValueError("A korábbi címek nem lehetnek üresek.")
        return titles

    @field_validator("skills")
    @classmethod
    def remove_duplicate_skills(cls, skills: list[SkillName]) -> list[SkillName]:
        return list(dict.fromkeys(skills))


class ActivityContent(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=100)]
    subtitle: Annotated[str, Field(min_length=1, max_length=120)] | None
    materials: Annotated[list[str], Field(min_length=1, max_length=10)]
    steps: Annotated[list[str], Field(min_length=3, max_length=3)]
    safety: Annotated[str, Field(min_length=1, max_length=280)]

    @field_validator("title", "subtitle", "safety", mode="before")
    @classmethod
    def remove_emojis(cls, value):
        if not isinstance(value, str):
            return value
        return EMOJI_PATTERN.sub("", value).strip()

    @field_validator("materials", "steps", mode="before")
    @classmethod
    def remove_emojis_from_lists(cls, values: list[str]) -> list[str]:
        if not isinstance(values, list):
            return values
        return [
            EMOJI_PATTERN.sub("", value).strip()
            if isinstance(value, str)
            else value
            for value in values
        ]


class GeneratedActivityContext(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=160)]
    description: Annotated[str, Field(min_length=1, max_length=500)]
    materials: Annotated[list[str], Field(min_length=1, max_length=10)]
    steps: Annotated[list[str], Field(min_length=3, max_length=3)]
    age: Annotated[int, Field(ge=3, le=12)]
    duration: Annotated[int, Field(ge=5, le=120)]
    skills: list[SkillName] = Field(default_factory=list)


class AdventureSheetRequest(GeneratedActivityContext):
    safety: Annotated[str, Field(min_length=1, max_length=500)]


class DevelopmentAreaRating(BaseModel):
    name: Annotated[str, Field(min_length=2, max_length=60)]
    stars: Annotated[StrictInt, Field(ge=1, le=3)]

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("A fejlesztési terület neve nem lehet üres.")
        return value


class ActivityEvaluationResponse(BaseModel):
    areas: Annotated[
        list[DevelopmentAreaRating],
        Field(min_length=3, max_length=3),
    ]

    @model_validator(mode="after")
    def area_names_must_be_unique(self) -> "ActivityEvaluationResponse":
        names = [area.name.casefold() for area in self.areas]
        if len(set(names)) != 3:
            raise ValueError("A fejlesztési területek nevei legyenek egyediek.")
        return self


class ActivityResponse(ActivityContent):
    age: int
    duration: int
    skills: list[SkillName]


class AdventureSheetBonus(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=44)]
    prompt: Annotated[str, Field(min_length=1, max_length=140)]
    twist: Annotated[str, Field(min_length=1, max_length=120)]
    symbol: Literal[
        "star",
        "circle",
        "square",
        "triangle",
        "leaf",
        "footprint",
        "book",
        "sun",
    ]

    @field_validator("title", "prompt", "twist", mode="before")
    @classmethod
    def remove_emojis(cls, value: str):
        if not isinstance(value, str):
            return value
        return EMOJI_PATTERN.sub("", value).strip()
