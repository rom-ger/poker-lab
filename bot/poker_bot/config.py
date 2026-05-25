import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Config:
    bot_token: str
    api_id: int
    api_hash: str


def load_config() -> Config:
    bot_token = os.environ.get("BOT_TOKEN", "").strip()
    api_id_raw = os.environ.get("TELEGRAM_API_ID", "").strip()
    api_hash = os.environ.get("TELEGRAM_API_HASH", "").strip()

    missing = []
    if not bot_token:
        missing.append("BOT_TOKEN")
    if not api_id_raw:
        missing.append("TELEGRAM_API_ID")
    if not api_hash:
        missing.append("TELEGRAM_API_HASH")

    if missing:
        raise RuntimeError(
            f"Missing required env vars: {', '.join(missing)}. "
            "Copy bot/.env.example to bot/.env and fill in values."
        )

    try:
        api_id = int(api_id_raw)
    except ValueError as exc:
        raise RuntimeError("TELEGRAM_API_ID must be an integer") from exc

    return Config(bot_token=bot_token, api_id=api_id, api_hash=api_hash)
