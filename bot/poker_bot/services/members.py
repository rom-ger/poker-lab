from telethon import TelegramClient
from telethon.errors import ChatAdminRequiredError, RPCError
from telethon.tl.types import Channel, Chat


class MembersFetchError(Exception):
    pass


async def fetch_participants(client: TelegramClient, chat_id: int) -> dict[int, str]:
    try:
        entity = await client.get_entity(chat_id)
    except RPCError as exc:
        raise MembersFetchError("Не удалось получить информацию о чате.") from exc

    if not isinstance(entity, (Chat, Channel)):
        raise MembersFetchError("Команда работает только в группах.")

    participants: dict[int, str] = {}

    try:
        async for user in client.iter_participants(entity):
            if user.bot or user.deleted:
                continue
            name = _display_name(user.first_name, user.last_name, user.username, user.id)
            participants[user.id] = name
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


def _display_name(
    first_name: str | None,
    last_name: str | None,
    username: str | None,
    user_id: int,
) -> str:
    parts = [p for p in (first_name, last_name) if p]
    if parts:
        return " ".join(parts)
    if username:
        return f"@{username}"
    return str(user_id)
