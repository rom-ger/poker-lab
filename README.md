# Planning Poker (P2P)

MVP Planning Poker без backend-состояния и БД. Синхронизация комнаты — **peer-to-peer** через WebRTC Data Channels. Signaling-сервер только помогает установить соединение (SDP/ICE).

## Архитектура WebRTC

```
┌─────────┐     WebSocket (SDP/ICE)      ┌──────────────┐
│ Browser │ ◄──────────────────────────► │  Signaling   │
│   (A)   │         без state            │   (~50 LOC)  │
└────┬────┘                              └──────────────┘
     │ Data Channel (JSON)
     │  STATE / ACTION
     ▼
┌─────────┐
│ Browser │
│   (B)   │
└─────────┘
```

**Топология «звезда»:** один участник — **host**. Host хранит каноническое состояние (Zustand) и рассылает `STATE` всем гостям. Гости отправляют `ACTION` только host'у.

**Почему так:** проще, чем mesh; достаточно для MVP; легко делать reveal/reset с одной точки правды.

**Поток данных:**
1. Пользователь голосует → `ACTION { VOTE }` → host применяет → `STATE` broadcast.
2. Host нажимает Reveal → `phase: revealed` → все видят карты.
3. Reset → обнуляет голоса, `phase: voting`.

**Host migration:** signaling при `disconnect` выбирает нового host (минимальный `peerId`). У всех уже есть копия state из последнего `STATE` — новый host пересоздаёт WebRTC-офферы.

## Signaling

Сервер (`server/index.js`) — **только relay**:
- `join` — вход в комнату, список peers, `hostId`
- `offer` / `answer` / `ice` — проброс между `from` и `to`
- `peer-joined` / `peer-left` / `host-changed` — уведомления

Никакого хранения голосов, фаз, имён на сервере.

## Структура проекта

```
poker-lab/
├── client/                 # React + Vite + Tailwind + Zustand
│   └── src/
│       ├── components/     # UI
│       ├── hooks/          # useRoom, useSignaling
│       ├── lib/            # WebRTC, roomId, storage
│       ├── pages/          # Home, Room
│       ├── store/          # Zustand
│       └── types/
├── server/                 # ws signaling relay
├── package.json            # npm workspaces
└── README.md
```

## Локальный запуск

```bash
# из корня репозитория
npm install
cd server && npm install && cd ..

# терминал 1 — signaling
npm run dev -w server

# терминал 2 — frontend
npm run dev -w client
```

Или одной командой (нужен `concurrently` из корня):

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Signaling: ws://localhost:3001

Скопируйте `client/.env.example` → `client/.env` при необходимости.

## Деплой

| Часть | Куда | Как |
|-------|------|-----|
| **client** | Vercel / Netlify / Cloudflare Pages | `npm run build -w client`, publish `client/dist` |
| **signaling** | Railway / Fly.io / Render | `npm run start -w server`, `PORT` env |

На production задайте:

```
VITE_SIGNALING_URL=wss://your-signaling.example.com
```

**Важно:** signaling должен быть **WSS** (HTTPS-сайт + `wss://`).

## Ограничения

- Нужен публичный signaling + STUN; за жёстким NAT может понадобиться TURN (платный).
- Host — единая точка рассылки; при падении host — краткий разрыв до migration.
- Нет персистентности: закрыли все вкладки — комната исчезла.
- Reconnect MVP-уровня (повторный join через 2с).
- Нет end-to-end шифрования application-level (только DTLS в WebRTC).

## Идеи на будущее

- TURN-сервер для корпоративных сетей
- Mesh или CRDT для равноправных peer'ов
- История раундов, экспорт
- Аватарки, emoji-реакции
- Password на комнату (shared secret в URL hash)
- Observability (кто host, RTT)

## Стек

React · TypeScript · Vite 5 · Tailwind CSS 4 · WebRTC Data Channels · Zustand · ws (signaling)
