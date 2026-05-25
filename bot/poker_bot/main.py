import asyncio
import logging
import sys

from telethon import TelegramClient
from telethon.sessions import StringSession

from poker_bot.config import load_config
from poker_bot.handlers.callbacks import register_callbacks
from poker_bot.handlers.start_poker import register_start_poker
from poker_bot.services.round_service import RoundService
from poker_bot.state.round_store import RoundStore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("poker_bot")


async def main() -> None:
    config = load_config()
    store = RoundStore()
    rounds = RoundService(store)

    client = TelegramClient(
        StringSession(),
        config.api_id,
        config.api_hash,
    )

    register_start_poker(client, rounds)
    register_callbacks(client, rounds)

    await client.start(bot_token=config.bot_token)
    me = await client.get_me()
    logger.info("Bot started as @%s (id=%s)", me.username, me.id)

    await client.run_until_disconnected()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Stopped")
        sys.exit(0)
