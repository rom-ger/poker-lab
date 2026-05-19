/**
 * Minimal WebRTC signaling relay — no application state.
 * Forwards SDP/ICE between peers in the same room.
 */
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 3001;
const wss = new WebSocketServer({ port: PORT });

/** @type {Map<string, Map<string, { ws: import('ws').WebSocket, name: string }>>} */
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  return rooms.get(roomId);
}

function pickHost(room) {
  const ids = [...room.keys()].sort();
  return ids[0] ?? null;
}

function broadcast(roomId, message, exceptPeerId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const data = JSON.stringify(message);
  for (const [peerId, peer] of room) {
    if (peerId !== exceptPeerId && peer.ws.readyState === 1) {
      peer.ws.send(data);
    }
  }
}

function send(ws, message) {
  if (ws.readyState === 1) ws.send(JSON.stringify(message));
}

wss.on('connection', (ws) => {
  /** @type {{ roomId?: string, peerId?: string }} */
  const meta = {};

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    switch (msg.type) {
      case 'join': {
        const { roomId, peerId, name } = msg;
        meta.roomId = roomId;
        meta.peerId = peerId;

        const room = getRoom(roomId);
        const existingPeers = [...room.entries()].map(([id, p]) => ({
          peerId: id,
          name: p.name,
        }));

        room.set(peerId, { ws, name });
        const hostId = pickHost(room);

        send(ws, {
          type: 'joined',
          peerId,
          hostId,
          peers: existingPeers,
        });

        broadcast(roomId, { type: 'peer-joined', peerId, name }, peerId);
        break;
      }

      case 'offer':
      case 'answer':
      case 'ice': {
        const room = rooms.get(msg.roomId);
        const target = room?.get(msg.to);
        if (target) send(target.ws, msg);
        break;
      }

      default:
        break;
    }
  });

  ws.on('close', () => {
    const { roomId, peerId } = meta;
    if (!roomId || !peerId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.delete(peerId);
    broadcast(roomId, { type: 'peer-left', peerId });

    if (room.size > 0) {
      const hostId = pickHost(room);
      broadcast(roomId, { type: 'host-changed', hostId });
    } else {
      rooms.delete(roomId);
    }
  });
});

console.log(`Signaling server on ws://localhost:${PORT}`);
