FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./
COPY poker_bot/ ./poker_bot/

RUN pip install --no-cache-dir .

CMD ["python", "-m", "poker_bot.main"]
