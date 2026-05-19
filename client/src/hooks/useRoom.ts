import { useCallback, useEffect, useRef } from 'react'
import { STORAGE_HOST_ROOM_KEY } from '../lib/constants'
import { peerManager } from '../lib/peerManager'
import { createInitialState, useRoomStore } from '../store/roomStore'
import type { ClientAction, DataMessage } from '../types'

function hostBackoff(peerId: string): number {
  let h = 0
  for (let i = 0; i < peerId.length; i++) h = (h + peerId.charCodeAt(i)) % 5000
  return 1500 + h
}

export function useRoom(
  roomId: string,
  peerId: string,
  name: string,
  asCreator: boolean,
) {
  const store = useRoomStore()
  const mounted = useRef(true)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHostRef = useRef(false)

  const isHost = () => useRoomStore.getState().peerId === useRoomStore.getState().hostId

  const broadcastState = useCallback(() => {
    const snapshot = useRoomStore.getState().getSnapshot()
    if (!snapshot || !isHost()) return
    peerManager.broadcast({ type: 'STATE', payload: snapshot })
  }, [])

  const handleData = useCallback((msg: DataMessage, _from: string) => {
    if (msg.type === 'STATE') {
      useRoomStore.getState().applyState(msg.payload)
      return
    }

    if (msg.type === 'ACTION' && isHost()) {
      const next = useRoomStore.getState().applyActionAsHost(
        msg.payload,
        msg.from,
      )
      if (next) {
        peerManager.broadcast({ type: 'STATE', payload: next })
      }
    }
  }, [])

  const sendAction = useCallback((action: ClientAction) => {
    const { hostId, peerId: self } = useRoomStore.getState()
    if (!hostId || !self) return

    if (isHost()) {
      const next = useRoomStore.getState().applyActionAsHost(action, self)
      if (next) {
        peerManager.broadcast({ type: 'STATE', payload: next })
      }
    } else {
      peerManager.sendToHost({
        type: 'ACTION',
        payload: action,
        from: self,
      })
    }
  }, [])

  const setupAsHost = useCallback(() => {
    isHostRef.current = true
    sessionStorage.setItem(STORAGE_HOST_ROOM_KEY, `${roomId}:${peerId}`)
    useRoomStore.getState().setHostId(peerId)

    const existing = useRoomStore.getState().getSnapshot()
    if (existing && Object.keys(existing.players).length > 0) {
      existing.hostId = peerId
      existing.players[peerId] = {
        id: peerId,
        name,
        vote: existing.players[peerId]?.vote ?? null,
        hasVoted: existing.players[peerId]?.hasVoted ?? false,
        connected: true,
      }
      useRoomStore.getState().applyState(existing)
    } else {
      useRoomStore.getState().applyState(
        createInitialState(roomId, peerId, peerId, name),
      )
    }
  }, [roomId, peerId, name])

  const tryClaimHost = useCallback(
    async (aborted: () => boolean): Promise<boolean> => {
      try {
        await peerManager.startAsHost(roomId)
        if (aborted() || !mounted.current) return false
        setupAsHost()
        broadcastState()
        useRoomStore.getState().setConnectionStatus('connected')
        return true
      } catch {
        return false
      }
    },
    [roomId, setupAsHost, broadcastState],
  )

  const connectAsGuest = useCallback(
    async (aborted: () => boolean) => {
      await peerManager.startAsGuest(roomId, peerId, name)
      if (aborted() || !mounted.current) return
      useRoomStore.getState().setConnectionStatus('connected')
    },
    [roomId, peerId, name],
  )

  const join = useCallback(async (aborted: () => boolean) => {
    useRoomStore.getState().setConnectionStatus('connecting')
    useRoomStore.getState().setError(null)
    useRoomStore.getState().setMeta({
      roomId,
      peerId,
      hostId: peerId,
      myName: name,
    })

    peerManager.configure({
      onData: handleData,
      onGuestJoined: (guestId, guestName) => {
        useRoomStore.getState().addPlayer({
          id: guestId,
          name: guestName,
          vote: null,
          hasVoted: false,
          connected: true,
        })
        broadcastState()
      },
      onGuestLeft: (guestId) => {
        useRoomStore.getState().removePlayer(guestId)
      },
      onHostLost: () => {
        if (!mounted.current || isHostRef.current) return
        scheduleReconnectRef.current()
      },
    })

    const savedHost = sessionStorage.getItem(STORAGE_HOST_ROOM_KEY)
    const wasHostThisRoom = savedHost === `${roomId}:${peerId}`
    const shouldTryHost = asCreator || wasHostThisRoom

    try {
      if (shouldTryHost) {
        const ok = await tryClaimHost(aborted)
        if (aborted()) return
        if (ok) return
      }
      await connectAsGuest(aborted)
      if (aborted()) return
    } catch (e) {
      if (aborted()) return
      useRoomStore
        .getState()
        .setError(e instanceof Error ? e.message : 'Ошибка подключения')
      useRoomStore.getState().setConnectionStatus('error')
    }
  }, [
    roomId,
    peerId,
    name,
    asCreator,
    handleData,
    broadcastState,
    tryClaimHost,
    connectAsGuest,
  ])

  const scheduleReconnectRef = useRef<() => void>(() => {})

  const scheduleReconnect = useCallback(() => {
    if (!mounted.current) return
    useRoomStore.getState().setConnectionStatus('reconnecting')
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)

    reconnectTimer.current = setTimeout(async () => {
      peerManager.destroy()
      isHostRef.current = false

      try {
        await connectAsGuest(() => false)
      } catch {
        const claimed = await tryClaimHost(() => false)
        if (!claimed && mounted.current) {
          useRoomStore.getState().setError('Хост недоступен. Попробуйте обновить страницу.')
          useRoomStore.getState().setConnectionStatus('error')
        }
      }
    }, hostBackoff(peerId))
  }, [peerId, connectAsGuest, tryClaimHost])

  scheduleReconnectRef.current = scheduleReconnect

  useEffect(() => {
    mounted.current = true
    let cancelled = false
    const aborted = () => cancelled || !mounted.current

    void join(aborted)

    return () => {
      cancelled = true
      mounted.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      peerManager.destroy()
      isHostRef.current = false
      useRoomStore.getState().reset()
    }
  }, [roomId, peerId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...store,
    isHost: store.peerId === store.hostId,
    sendAction,
    vote: (vote: ClientAction & { type: 'VOTE' }) => sendAction(vote),
    reveal: () => sendAction({ type: 'REVEAL' }),
    reset: () => sendAction({ type: 'RESET' }),
    scheduleReconnect,
  }
}
