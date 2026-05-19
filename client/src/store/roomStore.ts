import { create } from 'zustand'
import type {
  ClientAction,
  ConnectionStatus,
  Player,
  RoomState,
  VotePhase,
} from '../types'

interface RoomStore {
  roomId: string | null
  peerId: string | null
  hostId: string | null
  myName: string
  phase: VotePhase
  players: Record<string, Player>
  connectionStatus: ConnectionStatus
  error: string | null

  setMeta: (data: {
    roomId: string
    peerId: string
    hostId: string
    myName: string
  }) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setError: (error: string | null) => void
  applyState: (state: RoomState) => void
  setHostId: (hostId: string) => void
  setPlayerConnected: (peerId: string, connected: boolean) => void
  addPlayer: (player: Player) => void
  removePlayer: (peerId: string) => void

  /** Host-only: apply action and return new state snapshot */
  applyActionAsHost: (action: ClientAction, from: string) => RoomState | null
  getSnapshot: () => RoomState | null
  reset: () => void
}

const initial = {
  roomId: null,
  peerId: null,
  hostId: null,
  myName: '',
  phase: 'voting' as VotePhase,
  players: {} as Record<string, Player>,
  connectionStatus: 'idle' as ConnectionStatus,
  error: null,
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  ...initial,

  setMeta: ({ roomId, peerId, hostId, myName }) =>
    set({ roomId, peerId, hostId, myName }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setError: (error) => set({ error }),

  applyState: (state) =>
    set({
      roomId: state.roomId,
      hostId: state.hostId,
      phase: state.phase,
      players: state.players,
    }),

  setHostId: (hostId) => set({ hostId }),

  setPlayerConnected: (peerId, connected) =>
    set((s) => {
      const p = s.players[peerId]
      if (!p) return s
      return {
        players: { ...s.players, [peerId]: { ...p, connected } },
      }
    }),

  addPlayer: (player) =>
    set((s) => ({
      players: { ...s.players, [player.id]: player },
    })),

  removePlayer: (peerId) =>
    set((s) => {
      const next = { ...s.players }
      delete next[peerId]
      return { players: next }
    }),

  applyActionAsHost: (action, from) => {
    const s = get()
    if (!s.roomId || !s.hostId || s.peerId !== s.hostId) return null

    let phase = s.phase
    let players = { ...s.players }

    const ensure = (id: string): Player | null => players[id] ?? null

    switch (action.type) {
      case 'VOTE': {
        const p = ensure(from)
        if (!p || phase !== 'voting') return null
        players = {
          ...players,
          [from]: { ...p, vote: action.vote, hasVoted: true },
        }
        break
      }
      case 'REVEAL':
        if (phase !== 'voting') return null
        phase = 'revealed'
        break
      case 'RESET':
        phase = 'voting'
        players = Object.fromEntries(
          Object.entries(players).map(([id, p]) => [
            id,
            { ...p, vote: null, hasVoted: false },
          ]),
        )
        break
      case 'SET_NAME': {
        const p = ensure(from)
        if (!p) return null
        players = {
          ...players,
          [from]: { ...p, name: action.name.trim() || p.name },
        }
        break
      }
      default:
        return null
    }

    set({ phase, players })
    return get().getSnapshot()
  },

  getSnapshot: () => {
    const s = get()
    if (!s.roomId || !s.hostId) return null
    return {
      roomId: s.roomId,
      hostId: s.hostId,
      phase: s.phase,
      players: s.players,
    }
  },

  reset: () => set(initial),
}))

export function createInitialState(
  roomId: string,
  hostId: string,
  peerId: string,
  name: string,
): RoomState {
  return {
    roomId,
    hostId,
    phase: 'voting',
    players: {
      [peerId]: {
        id: peerId,
        name,
        vote: null,
        hasVoted: false,
        connected: true,
      },
    },
  }
}
