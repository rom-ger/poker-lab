# Planning Poker — Telegram Bot

Telegram-бот для Planning Poker в групповых чатах. Запускает раунд голосования по команде `/start_poker`, показывает inline-кнопки с картами Фибоначчи и автоматически раскрывает результат, когда все участники проголосовали.

## Требования

- Python 3.11+
- Docker и Docker Compose (для контейнерного запуска)
- Telegram-бот ([@BotFather](https://t.me/BotFather))
- `TELEGRAM_API_ID` и `TELEGRAM_API_HASH` с [my.telegram.org](https://my.telegram.org/apps)

## Настройка credentials

### 1. Bot token

Создайте бота через [@BotFather](https://t.me/BotFather) и скопируйте токен в `BOT_TOKEN`.

### 2. API ID и API Hash

1. Войдите на [my.telegram.org/apps](https://my.telegram.org/apps).
2. Создайте приложение (если ещё нет):
   - **Short name** — только латиница и цифры, без пробелов и `_`, например `pokerlabbot2026`
   - **URL** — можно оставить пустым
   - **Platform** — Desktop
3. Скопируйте **api_id** → `TELEGRAM_API_ID`, **api_hash** → `TELEGRAM_API_HASH`.

### 3. Файл окружения

```bash
cp .env.example .env
# заполните BOT_TOKEN, TELEGRAM_API_ID, TELEGRAM_API_HASH
```

## Добавление в группу

1. Добавьте бота в групповой чат.
2. **Сделайте бота администратором** — иначе Telegram не отдаст полный список участников.
3. Отправьте `/start_poker` в чате.

## Команды бота

| Действие | Описание |
|---|---|
| `/start_poker` | Запустить новый раунд (перезапускает активный) |
| Кнопки карт | Проголосовать (можно менять голос до reveal) |
| **Завершить раунд** | Досрочно показать среднее — только инициатор |
| **Начать новый раунд** | Сбросить голоса — только инициатор |

## Локальный запуск

Из корня репозитория (venv создаётся автоматически):

```bash
make bot-install   # один раз: создаёт bot/.venv и ставит зависимости
make bot-dev
# или
npm run dev:bot
```

Вручную:

```bash
cd bot
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
python -m poker_bot.main
```

## Docker

Из корня репозитория:

```bash
cp bot/.env.example bot/.env   # заполнить значения
make bot-run                   # собрать и запустить в фоне
make bot-logs                  # логи
make bot-stop                  # остановить
```

## Ограничения

- Состояние раундов хранится **в памяти** — рестарт бота сбрасывает активные раунды.
- Участники фиксируются **snapshot'ом** на момент `/start_poker`.
- Web-клиент (`client/`) и Telegram-бот **не связаны** — отдельные каналы.
- Карты `?` и `☕` не участвуют в расчёте среднего (как в web-клиенте).
