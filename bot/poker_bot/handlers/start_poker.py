from telethon import TelegramClient, events
from telethon.tl.types import User

from poker_bot.services.members import MembersFetchError, fetch_participants, format_participant, participant_from_user
from poker_bot.services.round_service import RoundService
from poker_bot.ui.keyboards import voting_keyboard
from poker_bot.ui.messages import format_cancelled_message, format_voting_message


def register_start_poker(client: TelegramClient, rounds: RoundService) -> None:
    @client.on(events.NewMessage(pattern=r"^/start_poker(?:@\w+)?$"))
    async def handle_start_poker(event: events.NewMessage.Event) -> None:
        if not event.is_group:
            await event.reply(
                "Planning Poker работает в групповых чатах. "
                "Добавьте бота в группу и отправьте /start_poker там."
            )
            return

        sender = await event.get_sender()
        if not isinstance(sender, User):
            return

        initiator = participant_from_user(sender)
        initiator_name = format_participant(initiator)
        chat_id = event.chat_id

        previous = rounds.cancel_round(chat_id)
        if previous is not None:
            try:
                await client.edit_message(
                    previous.chat_id,
                    previous.message_id,
                    format_cancelled_message(),
                    buttons=None,
                )
            except Exception:
                pass

        try:
            participants = await fetch_participants(client, chat_id)
        except MembersFetchError as exc:
            await event.reply(str(exc))
            return

        participants[sender.id] = initiator

        message = await event.reply(
            format_voting_message(
                rounds.start_round(
                    chat_id=chat_id,
                    message_id=0,
                    initiator_id=sender.id,
                    initiator_name=initiator_name,
                    participants=participants,
                )
            ),
            buttons=voting_keyboard(),
            parse_mode="md",
        )

        state = rounds.get(chat_id)
        if state is not None:
            state.message_id = message.id
