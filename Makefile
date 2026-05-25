PYTHON ?= python3
BOT_DIR = bot
BOT_VENV = $(BOT_DIR)/.venv
BOT_PYTHON = $(BOT_VENV)/bin/python
BOT_PIP = $(BOT_PYTHON) -m pip

.PHONY: bot-build bot-run bot-dev bot-logs bot-stop bot-shell bot-install

bot-install:
	@test -d $(BOT_VENV) || $(PYTHON) -m venv $(BOT_VENV)
	$(BOT_PIP) install -e $(BOT_DIR)

bot-build:
	docker build -t poker-lab-poker-bot ./bot

bot-run: bot-build
	@test -f bot/.env || (echo "Create bot/.env from bot/.env.example first" && exit 1)
	docker compose up -d poker-bot

bot-dev: bot-install
	cd $(BOT_DIR) && ../$(BOT_PYTHON) -m poker_bot.main

bot-logs:
	docker compose logs -f poker-bot

bot-stop:
	docker compose down

bot-shell:
	docker compose run --rm poker-bot sh
