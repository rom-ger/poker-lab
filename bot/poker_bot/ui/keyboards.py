from telethon import Button

from poker_bot.domain.cards import CardValue, format_card

# Ряды под ширину Telegram: трёхзначные — в коротких строках.
VOTING_CARD_ROWS: tuple[tuple[CardValue, ...], ...] = (
    (1, 2, 3, 5),
    (8, 13, 21),
    (34, 55, 89),
    (144, 233),
    ("?", "coffee"),
)


def voting_keyboard() -> list[list[Button]]:
    rows: list[list[Button]] = [
        [
            Button.inline(format_card(value), f"v:{value}")
            for value in card_row
        ]
        for card_row in VOTING_CARD_ROWS
    ]
    rows.append([Button.inline("Завершить раунд", b"end")])
    return rows


def revealed_keyboard() -> list[list[Button]]:
    return [[Button.inline("Начать новый раунд", b"new")]]
