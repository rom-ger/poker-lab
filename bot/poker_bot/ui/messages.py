from poker_bot.domain.average import calculate_average
from poker_bot.domain.cards import format_card
from poker_bot.services.members import format_participant
from poker_bot.state.round_store import RoundState


def format_voting_message(state: RoundState) -> str:
    voted_ids = set(state.votes.keys())
    voted_labels = [
        format_participant(state.participants[uid])
        for uid in state.participants
        if uid in voted_ids
    ]
    pending_labels = [
        format_participant(state.participants[uid])
        for uid in state.participants
        if uid not in voted_ids
    ]

    lines = [
        "🃏 **Planning Poker — голосование**",
        "",
        f"Проголосовали ({len(voted_labels)}/{len(state.participants)}):",
    ]

    if voted_labels:
        lines.extend(f"✓ {label}" for label in voted_labels)
    else:
        lines.append("— пока никто")

    lines.extend(["", "Ожидают:"])
    if pending_labels:
        lines.extend(f"○ {label}" for label in pending_labels)
    else:
        lines.append("— все проголосовали")

    lines.extend(["", f"Инициатор: {state.initiator_name}"])
    return "\n".join(lines)


def format_revealed_message(state: RoundState) -> str:
    lines = [
        "🃏 **Planning Poker — результаты**",
        "",
        "Голоса:",
    ]

    for user_id, participant in state.participants.items():
        vote = state.votes.get(user_id)
        vote_label = format_card(vote) if vote is not None else "—"
        lines.append(f"{format_participant(participant)} — {vote_label}")

    avg = calculate_average(state.votes)
    lines.extend(["", f"**Среднее:** {avg if avg is not None else '—'}"])
    lines.extend(["", f"Инициатор: {state.initiator_name}"])
    return "\n".join(lines)


def format_cancelled_message() -> str:
    return "🃏 Раунд Planning Poker отменён (запущен новый)."
