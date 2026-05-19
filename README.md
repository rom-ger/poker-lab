# Planning Poker (P2P + PeerJS Cloud)

MVP Planning Poker: состояние комнаты только в браузерах, синхронизация по WebRTC Data Channels. **Signaling — PeerJS Cloud** (`0.peerjs.com`), свой сервер не нужен.

## Архитектура

```
Статика (Vite build)  ──HTTPS──►  GitHub Pages / Netlify / …
                                        │
                         wss://0.peerjs.com (только SDP/ICE)
                                        │
Browser A ◄══════ WebRTC Data Channel (STATE / ACTION) ══════► Browser B
```

- **Host** регистрирует Peer ID `poker-{roomId}` на PeerJS Cloud.
- **Гости** подключаются к этому ID (`peer.connect`).
- Голоса и фазы идут **напрямую** между браузерами после handshake.

## Локальный запуск

```bash
cd client
npm install
npm run dev
```

Откройте http://localhost:5173 — signaling сразу идёт на PeerJS Cloud (интернет обязателен).

## Деплой (только статика)

```bash
cd client
npm run build
# залить содержимое client/dist на хостинг
```

### Роутинг: HashRouter

Ссылки вида `https://poker-lab.spisoknado.ru/#/room/abc123` — сервер отдаёт только `index.html`, отдельная настройка nginx не нужна.

**Переменные окружения не обязательны** — по умолчанию `0.peerjs.com`.

Опционально в `.env.production`:

```
VITE_PEERJS_HOST=0.peerjs.com
VITE_PEERJS_PORT=443
VITE_PEERJS_SECURE=true
```

## Как пользоваться

1. **Создать комнату** — вы становитесь host, в URL будет `?create=1`.
2. **Скопировать ссылку** без `create=1` для коллег (или целиком — гость подключится к host).
3. Голосуйте → host жмёт «Показать голоса» → «Новый раунд».

## Host migration (best-effort)

Если host закрыл вкладку, гости ждут и пробуют переподключиться. Один из участников может занять `poker-{roomId}` (с задержкой по `peerId`) и продолжить с последним известным state.

## Ограничения

- Зависимость от **PeerJS Cloud** (бесплатный, без SLA).
- **Разные сети / NAT:** без TURN P2P может не установиться (в Firefox: `ICE failed`, в Chrome — вечный спиннер).
- Встроенный TURN PeerJS (`turn.peerjs.com`) **отключён** — он часто не работает.
- Публичный Peer ID комнаты `poker-{roomId}` — любой, кто знает ID, может попытаться войти.

### TURN (если гость не подключается)

1. Зарегистрируйтесь на [Metered Open Relay](https://www.metered.ca/tools/openrelay/) (или свой coturn).
2. В `client/.env.production`:

```
VITE_TURN_URLS=turn:standard.relay.metered.ca:80,turn:standard.relay.metered.ca:443
VITE_TURN_USERNAME=...
VITE_TURN_CREDENTIAL=...
```

3. `npm run build` и задеплойте заново.

**Быстрая проверка:** хост и гость в **одной Wi‑Fi** — часто работает и без TURN.

## Стек

React · TypeScript · Vite · Tailwind · Zustand · PeerJS · WebRTC
