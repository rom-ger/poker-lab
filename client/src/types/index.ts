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

export type DataMessage =
  | { type: 'STATE'; payload: RoomState }
  | { type: 'ACTION'; payload: ClientAction; from: string }
