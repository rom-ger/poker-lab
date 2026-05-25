from telethon import TelegramClient
from telethon.errors import ChatAdminRequiredError, RPCError
from telethon.tl.types import Channel, Chat, User

from poker_bot.state.round_store import Participant


class MembersFetchError(Exception):
    pass


async def fetch_participants(client: TelegramClient, chat_id: int) -> dict[int, Participant]:
    try:
        entity = await client.get_entity(chat_id)
    except RPCError as exc:
        raise MembersFetchError("Не удалось получить информацию о чате.") from exc

    if not isinstance(entity, (Chat, Channel)):
        raise MembersFetchError("Команда работает только в группах.")

    participants: dict[int, Participant] = {}

    try:
        async for user in client.iter_participants(entity):
            if user.bot or user.deleted:
                continue
            participants[user.id] = participant_from_user(user)
    except ChatAdminRequiredError as exc:
        raise MembersFetchError(
            "Бот должен быть администратором группы, чтобы получить список участников. "
            "Добавьте бота админом и попробуйте снова."
        ) from exc
    except RPCError as exc:
        raise MembersFetchError(
            "Не удалось получить список участников. "
            "Убедитесь, что бот добавлен в группу и имеет права администратора."
        ) from exc

    if not participants:
        raise MembersFetchError(
            "В группе не найдено участников для голосования. "
            "Добавьте бота админом и попробуйте снова."
        )

    return participants


def participant_from_user(user: User) -> Participant:
    parts = [p for p in (user.first_name, user.last_name) if p]
    display_name = " ".join(parts)
    if not display_name:
        display_name = f"@{user.username}" if user.username else str(user.id)
    return Participant(display_name=display_name, username=user.username)


def format_participant(participant: Participant) -> str:
    if participant.username and not participant.display_name.startswith("@"):
        return f"{participant.display_name} (@{participant.username})"
    return participant.display_name
