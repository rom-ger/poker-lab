from typing import Literal, Union

CardValue = Union[
    Literal[1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233],
    Literal["?", "coffee"],
]

CARD_VALUES: tuple[CardValue, ...] = (
    1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, "?", "coffee",
)


def format_card(value: CardValue) -> str:
    if value == "coffee":
        return "☕"
    return str(value)


def parse_card(raw: str) -> CardValue | None:
    if raw == "coffee":
        return "coffee"
    if raw == "?":
        return "?"
    try:
        num = int(raw)
    except ValueError:
        return None
    if num in CARD_VALUES:
        return num  # type: ignore[return-value]
    return None
