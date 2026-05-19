import { useCallback, useEffect, useRef } from 'react'
import { webrtcManager } from '../lib/webrtc'
import { createInitialState, useRoomStore } from '../store/roomStore'
import type { ClientAction, DataMessage, SignalingMessage } from '../types'
import { useSignaling } from './useSignaling'

export function useRoom(roomId: string, peerId: string, name: string) {
  const store = useRoomStore()
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(true)

  const isHost = () => useRoomStore.getState().peerId === useRoomStore.getState().hostId

  const broadcastState = useCallback(() => {
    const snapshot = useRoomStore.getState().getSnapshot()
    if (!snapshot || !isHost()) return
    const msg: DataMessage = { type: 'STATE', payload: snapshot }
    webrtcManager.broadcastToAll(msg)
  }, [])

  const handleData = useCallback(
    (msg: DataMessage, fromPeerId: string) => {
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
          webrtcManager.broadcastToAll({ type: 'STATE', payload: next })
        }
        return
      }

      if (msg.type === 'ACTION' && !isHost()) {
        /* client sent to host only — should not receive */
        void fromPeerId
      }
    },
    [],
  )

  const scheduleReconnectRef = useRef<() => void>(() => {})

  const sendAction = useCallback((action: ClientAction) => {
    const { hostId, peerId: self } = useRoomStore.getState()
    if (!hostId || !self) return

    if (isHost()) {
      const next = useRoomStore.getState().applyActionAsHost(action, self)
      if (next) {
        webrtcManager.broadcastToAll({ type: 'STATE', payload: next })
      }
    } else {
      webrtcManager.send(hostId, {
        type: 'ACTION',
        payload: action,
        from: self,
      })
    }
  }, [])

  const handleSignaling = useCallback(
    async (msg: SignalingMessage) => {
      switch (msg.type) {
        case 'signal-disconnected': {
          scheduleReconnectRef.current()
          break
        }

        case 'joined': {
          useRoomStore.getState().setHostId(msg.hostId)
          const host = msg.hostId === peerId

          webrtcManager.configure({
            roomId,
            selfId: peerId,
            isHost: host,
            onData: handleData,
            onPeerConnected: () => broadcastState(),
            sendSignal: signaling.send,
          })

          if (host) {
            const initial = createInitialState(roomId, peerId, peerId, name)
            useRoomStore.getState().applyState(initial)
            for (const p of msg.peers) {
              useRoomStore.getState().addPlayer({
                id: p.peerId,
                name: p.name,
                vote: null,
                hasVoted: false,
                connected: false,
              })
              await webrtcManager.connectAsHost(p.peerId)
            }
          }

          useRoomStore.getState().setConnectionStatus('connected')
          break
        }

        case 'peer-joined': {
          if (isHost()) {
            useRoomStore.getState().addPlayer({
              id: msg.peerId,
              name: msg.name,
              vote: null,
              hasVoted: false,
              connected: false,
            })
            await webrtcManager.connectAsHost(msg.peerId)
            broadcastState()
          }
          break
        }

        case 'peer-left': {
          webrtcManager.closePeer(msg.peerId)
          useRoomStore.getState().removePlayer(msg.peerId)
          break
        }

        case 'host-changed': {
          const wasHost = isHost()
          useRoomStore.getState().setHostId(msg.hostId)
          const nowHost = msg.hostId === peerId
          webrtcManager.setHost(nowHost)
          webrtcManager.closeAll()

          if (nowHost) {
            const snapshot = useRoomStore.getState().getSnapshot()
            if (snapshot) {
              snapshot.hostId = peerId
              useRoomStore.getState().applyState(snapshot)
            }
            const players = useRoomStore.getState().players
            for (const id of Object.keys(players)) {
              if (id !== peerId) {
                await webrtcManager.connectAsHost(id)
              }
            }
            broadcastState()
          } else if (wasHost) {
            /* became guest — wait for offers from new host */
          }
          break
        }

        case 'offer':
          if (msg.to === peerId) {
            await webrtcManager.handleOffer(msg.from, msg.sdp)
            if (isHost()) broadcastState()
          }
          break

        case 'answer':
          if (msg.to === peerId) {
            await webrtcManager.handleAnswer(msg.from, msg.sdp)
          }
          break

        case 'ice':
          if (msg.to === peerId) {
            await webrtcManager.handleIce(msg.from, msg.candidate)
          }
          break
      }
    },
    [roomId, peerId, name, handleData, broadcastState],
  )

  const signaling = useSignaling(handleSignaling)

  const join = useCallback(async () => {
    useRoomStore.getState().setConnectionStatus('connecting')
    useRoomStore.getState().setError(null)
    useRoomStore.getState().setMeta({ roomId, peerId, hostId: peerId, myName: name })

    try {
      await signaling.connect(roomId, peerId, name)
    } catch (e) {
      useRoomStore
        .getState()
        .setError(e instanceof Error ? e.message : 'Ошибка подключения')
      useRoomStore.getState().setConnectionStatus('error')
    }
  }, [roomId, peerId, name, signaling])

  const scheduleReconnect = useCallback(() => {
    if (!mounted.current) return
    useRoomStore.getState().setConnectionStatus('reconnecting')
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    reconnectTimer.current = setTimeout(() => {
      webrtcManager.closeAll()
      void join()
    }, 2000)
  }, [join])

  scheduleReconnectRef.current = scheduleReconnect

  useEffect(() => {
    mounted.current = true
    void join()

    return () => {
      mounted.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      signaling.disconnect()
      webrtcManager.closeAll()
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
