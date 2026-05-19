export const STORAGE_NAME_KEY = 'poker-lab-username'
export const STORAGE_PEER_KEY = 'poker-lab-peer-id'
export const STORAGE_HOST_ROOM_KEY = 'poker-lab-host-room'

/** PeerJS Cloud — только signaling */
export const PEERJS_CONFIG = {
  host: import.meta.env.VITE_PEERJS_HOST ?? '0.peerjs.com',
  port: Number(import.meta.env.VITE_PEERJS_PORT ?? 443),
  path: import.meta.env.VITE_PEERJS_PATH ?? '/',
  secure: import.meta.env.VITE_PEERJS_SECURE !== 'false',
}

/**
 * PeerJS по умолчанию подставляет turn.peerjs.com — он часто мёртв (ICE failed в Firefox).
 * Используем только STUN + опциональный TURN из env.
 */
export function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ]

  const turnUrls = import.meta.env.VITE_TURN_URLS as string | undefined
  const username = import.meta.env.VITE_TURN_USERNAME as string | undefined
  const credential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined

  if (turnUrls && username && credential) {
    servers.push({
      urls: turnUrls.split(',').map((u) => u.trim()),
      username,
      credential,
    })
  }

  return servers
}

export function createPeerOptions() {
  return {
    ...PEERJS_CONFIG,
    config: {
      iceServers: buildIceServers(),
      iceTransportPolicy: 'all' as RTCIceTransportPolicy,
    },
  }
}

export function hostPeerId(roomId: string): string {
  return `poker-${roomId}`
}
