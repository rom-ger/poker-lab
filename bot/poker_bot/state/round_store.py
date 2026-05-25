from dataclasses import dataclass, field
from typing import Literal

from poker_bot.domain.cards import CardValue

VotePhase = Literal["voting", "revealed"]


@dataclass
class RoundState:
    chat_id: int
    message_id: int
    initiator_id: int
    initiator_name: str
    phase: VotePhase
    participants: dict[int, str]
    votes: dict[int, CardValue] = field(default_factory=dict)


class RoundStore:
    def __init__(self) -> None:
        self._rounds: dict[int, RoundState] = {}

    def get(self, chat_id: int) -> RoundState | None:
        return self._rounds.get(chat_id)

    def set(self, state: RoundState) -> None:
        self._rounds[state.chat_id] = state

    def clear(self, chat_id: int) -> RoundState | None:
        return self._rounds.pop(chat_id, None)
