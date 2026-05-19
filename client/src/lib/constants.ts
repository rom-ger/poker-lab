export const STORAGE_NAME_KEY = 'poker-lab-username'
export const STORAGE_PEER_KEY = 'poker-lab-peer-id'

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export const SIGNALING_URL =
  import.meta.env.VITE_SIGNALING_URL ?? 'ws://localhost:3001'
