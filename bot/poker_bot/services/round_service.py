from poker_bot.domain.cards import CardValue
from poker_bot.state.round_store import RoundState, RoundStore, VotePhase


class RoundService:
    def __init__(self, store: RoundStore) -> None:
        self._store = store

    def get(self, chat_id: int) -> RoundState | None:
        return self._store.get(chat_id)

    def start_round(
        self,
        chat_id: int,
        message_id: int,
        initiator_id: int,
        initiator_name: str,
        participants: dict[int, str],
    ) -> RoundState:
        state = RoundState(
            chat_id=chat_id,
            message_id=message_id,
            initiator_id=initiator_id,
            initiator_name=initiator_name,
            phase="voting",
            participants=participants,
            votes={},
        )
        self._store.set(state)
        return state

    def cancel_round(self, chat_id: int) -> RoundState | None:
        return self._store.clear(chat_id)

    def record_vote(self, chat_id: int, user_id: int, vote: CardValue) -> RoundState | None:
        state = self._store.get(chat_id)
        if state is None or state.phase != "voting":
            return None
        if user_id not in state.participants:
            return None
        state.votes[user_id] = vote
        if self._all_voted(state):
            state.phase = "revealed"
        return state

    def reveal(self, chat_id: int) -> RoundState | None:
        state = self._store.get(chat_id)
        if state is None or state.phase != "voting":
            return None
        state.phase = "revealed"
        return state

    def reset_round(self, chat_id: int) -> RoundState | None:
        state = self._store.get(chat_id)
        if state is None or state.phase != "revealed":
            return None
        state.phase = "voting"
        state.votes.clear()
        return state

    @staticmethod
    def _all_voted(state: RoundState) -> bool:
        return len(state.votes) == len(state.participants)
