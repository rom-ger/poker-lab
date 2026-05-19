export const CARD_VALUES = [
  1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, '?', 'coffee',
] as const

export type CardValue = (typeof CARD_VALUES)[number]

export type VotePhase = 'voting' | 'revealed'

export interface Player {
  id: string
  name: string
  vote: CardValue | null
  hasVoted: boolean
  connected: boolean
}

export interface RoomState {
  roomId: string
  hostId: string
  phase: VotePhase
  players: Record<string, Player>
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

export type ClientAction =
  | { type: 'VOTE'; vote: CardValue }
  | { type: 'REVEAL' }
  | { type: 'RESET' }
  | { type: 'SET_NAME'; name: string }
  | { type: 'REMOVE_PLAYER'; targetId: string }

export type DataMessage =
  | { type: 'STATE'; payload: RoomState }
  | { type: 'ACTION'; payload: ClientAction; from: string }

/** Служебные сообщения поверх PeerJS (не путать с DataMessage) */
export type WireMessage =
  | DataMessage
  | { type: 'HELLO'; peerId: string; name: string }
  | { type: 'REQUEST_STATE'; peerId: string }
