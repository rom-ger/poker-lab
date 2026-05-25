import re

from telethon import TelegramClient, events
from telethon.errors import MessageNotModifiedError
from telethon.tl.types import User

from poker_bot.domain.cards import parse_card
from poker_bot.services.round_service import RoundService
from poker_bot.ui.keyboards import revealed_keyboard, voting_keyboard
from poker_bot.ui.messages import format_revealed_message, format_voting_message

_VOTE_PATTERN = re.compile(r"^v:(.+)$")


def register_callbacks(client: TelegramClient, rounds: RoundService) -> None:
    @client.on(events.CallbackQuery(pattern=r"^(v:.+|end|new)$"))
    async def handle_callback(event: events.CallbackQuery.Event) -> None:
        data = event.data.decode("utf-8")
        chat_id = event.chat_id
        if chat_id is None:
            await event.answer("Не удалось определить чат.", alert=True)
            return

        sender = await event.get_sender()
        if not isinstance(sender, User):
            return

        state = rounds.get(chat_id)
        if state is None:
            await event.answer("Активный раунд не найден. Запустите /start_poker.", alert=True)
            return

        if event.message_id != state.message_id:
            await event.answer("Это сообщение от другого раунда.", alert=True)
            return

        if data == "end":
            await _handle_end_round(event, rounds, chat_id, sender.id)
            return

        if data == "new":
            await _handle_new_round(event, rounds, chat_id, sender.id)
            return

        match = _VOTE_PATTERN.match(data)
        if match:
            await _handle_vote(event, rounds, chat_id, sender.id, match.group(1))
            return


async def _handle_vote(
    event: events.CallbackQuery.Event,
    rounds: RoundService,
    chat_id: int,
    user_id: int,
    raw_value: str,
) -> None:
    state = rounds.get(chat_id)
    if state is None or state.phase != "voting":
        await event.answer("Голосование уже завершено.", alert=True)
        return

    if user_id not in state.participants:
        await event.answer("Вы не входите в список участников этого раунда.", alert=True)
        return

    card = parse_card(raw_value)
    if card is None:
        await event.answer("Неизвестное значение карты.", alert=True)
        return

    updated = rounds.record_vote(chat_id, user_id, card)
    if updated is None:
        await event.answer("Не удалось записать голос.", alert=True)
        return

    await event.answer("Голос учтён")

    if updated.phase == "revealed":
        await _edit_round_message(event, format_revealed_message(updated), revealed_keyboard())
    else:
        await _edit_round_message(event, format_voting_message(updated), voting_keyboard())


async def _handle_end_round(
    event: events.CallbackQuery.Event,
    rounds: RoundService,
    chat_id: int,
    user_id: int,
) -> None:
    state = rounds.get(chat_id)
    if state is None:
        await event.answer("Активный раунд не найден.", alert=True)
        return

    if user_id != state.initiator_id:
        await event.answer("Только инициатор может завершить раунд.", alert=True)
        return

    if state.phase != "voting":
        await event.answer("Раунд уже завершён.", alert=True)
        return

    updated = rounds.reveal(chat_id)
    if updated is None:
        await event.answer("Не удалось завершить раунд.", alert=True)
        return

    await event.answer("Раунд завершён")
    await _edit_round_message(event, format_revealed_message(updated), revealed_keyboard())


async def _handle_new_round(
    event: events.CallbackQuery.Event,
    rounds: RoundService,
    chat_id: int,
    user_id: int,
) -> None:
    state = rounds.get(chat_id)
    if state is None:
        await event.answer("Активный раунд не найден.", alert=True)
        return

    if user_id != state.initiator_id:
        await event.answer("Только инициатор может начать новый раунд.", alert=True)
        return

    if state.phase != "revealed":
        await event.answer("Сначала завершите текущий раунд.", alert=True)
        return

    updated = rounds.reset_round(chat_id)
    if updated is None:
        await event.answer("Не удалось начать новый раунд.", alert=True)
        return

    await event.answer("Новый раунд начат")
    await _edit_round_message(event, format_voting_message(updated), voting_keyboard())


async def _edit_round_message(
    event: events.CallbackQuery.Event,
    text: str,
    buttons: list,
) -> None:
    try:
        await event.edit(text, buttons=buttons, parse_mode="md")
    except MessageNotModifiedError:
        pass
