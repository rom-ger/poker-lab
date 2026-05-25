from poker_bot.domain.average import calculate_average
from poker_bot.domain.cards import format_card
from poker_bot.state.round_store import RoundState


def format_voting_message(state: RoundState) -> str:
    voted_ids = set(state.votes.keys())
    voted_names = [state.participants[uid] for uid in state.participants if uid in voted_ids]
    pending_names = [
        state.participants[uid] for uid in state.participants if uid not in voted_ids
    ]

    lines = [
        "🃏 **Planning Poker — голосование**",
        "",
        f"Проголосовали ({len(voted_names)}/{len(state.participants)}):",
    ]

    if voted_names:
        lines.extend(f"✓ {name}" for name in voted_names)
    else:
        lines.append("— пока никто")

    lines.extend(["", "Ожидают:"])
    if pending_names:
        lines.extend(f"○ {name}" for name in pending_names)
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

    for user_id, name in state.participants.items():
        vote = state.votes.get(user_id)
        vote_label = format_card(vote) if vote is not None else "—"
        lines.append(f"{name} — {vote_label}")

    avg = calculate_average(state.votes)
    lines.extend(["", f"**Среднее:** {avg if avg is not None else '—'}"])
    lines.extend(["", f"Инициатор: {state.initiator_name}"])
    return "\n".join(lines)


def format_cancelled_message() -> str:
    return "🃏 Раунд Planning Poker отменён (запущен новый)."
