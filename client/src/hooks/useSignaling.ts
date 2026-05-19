import { useCallback, useEffect, useRef } from 'react'
import { SIGNALING_URL } from '../lib/constants'
import type { SignalingMessage } from '../types'

type Handler = (msg: SignalingMessage) => void

export function useSignaling(onMessage: Handler) {
  const wsRef = useRef<WebSocket | null>(null)
  const handlerRef = useRef(onMessage)
  handlerRef.current = onMessage

  const connect = useCallback(
    (roomId: string, peerId: string, name: string) => {
      return new Promise<WebSocket>((resolve, reject) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          resolve(wsRef.current)
          return
        }

        const ws = new WebSocket(SIGNALING_URL)
        wsRef.current = ws

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: 'join',
              roomId,
              peerId,
              name,
            } satisfies SignalingMessage),
          )
          resolve(ws)
        }

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(String(event.data)) as SignalingMessage
            handlerRef.current(msg)
          } catch {
            /* ignore */
          }
        }

        ws.onerror = () => reject(new Error('Не удалось подключиться к signaling'))

        ws.onclose = () => {
          wsRef.current = null
          handlerRef.current({ type: 'signal-disconnected' } as SignalingMessage)
        }
      })
    },
    [],
  )

  const send = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  useEffect(() => () => disconnect(), [disconnect])

  return { connect, send, disconnect }
}
