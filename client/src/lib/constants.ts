export const STORAGE_NAME_KEY = 'poker-lab-username'
export const STORAGE_PEER_KEY = 'poker-lab-peer-id'
export const STORAGE_HOST_ROOM_KEY = 'poker-lab-host-room'

/** PeerJS Cloud (0.peerjs.com) — только signaling, без state */
export const PEERJS_CONFIG = {
  host: import.meta.env.VITE_PEERJS_HOST ?? '0.peerjs.com',
  port: Number(import.meta.env.VITE_PEERJS_PORT ?? 443),
  path: import.meta.env.VITE_PEERJS_PATH ?? '/',
  secure: import.meta.env.VITE_PEERJS_SECURE !== 'false',
}

export function hostPeerId(roomId: string): string {
  return `poker-${roomId}`
}
