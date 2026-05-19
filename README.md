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
# залить содержимое client/dist на любой static hosting
```

Примеры: GitHub Pages, Cloudflare Pages, Netlify, S3 + CloudFront.

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
- За строгим NAT может понадобиться **TURN** (не настроен).
- Публичный Peer ID комнаты `poker-{roomId}` — любой, кто знает ID, может попытаться войти.

## Стек

React · TypeScript · Vite · Tailwind · Zustand · PeerJS · WebRTC
