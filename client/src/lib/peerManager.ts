import Peer, { type DataConnection } from 'peerjs'
import { hostPeerId, PEERJS_CONFIG } from './constants'
import type { DataMessage } from '../types'

export type DataHandler = (msg: DataMessage, fromPeerId: string) => void

type WireMessage = DataMessage | { type: 'HELLO'; peerId: string; name: string }

export class PeerManager {
  private peer: Peer | null = null
  private connections = new Map<string, DataConnection>()
  private hostConnection: DataConnection | null = null
  private generation = 0
  private connectTimeout: ReturnType<typeof setTimeout> | null = null
  private onData: DataHandler = () => {}
  private onGuestJoined = (_peerId: string, _name: string) => {}
  private onGuestLeft = (_peerId: string) => {}
  private onHostLost = () => {}

  configure(handlers: {
    onData: DataHandler
    onGuestJoined?: (peerId: string, name: string) => void
    onGuestLeft?: (peerId: string) => void
    onHostLost?: () => void
  }) {
    this.onData = handlers.onData
    this.onGuestJoined = handlers.onGuestJoined ?? (() => {})
    this.onGuestLeft = handlers.onGuestLeft ?? (() => {})
    this.onHostLost = handlers.onHostLost ?? (() => {})
  }

  private isStale(gen: number) {
    return gen !== this.generation
  }

  private clearConnectTimeout() {
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout)
      this.connectTimeout = null
    }
  }

  private armTimeout(gen: number, reject: (e: Error) => void, ms = 20000) {
    this.clearConnectTimeout()
    this.connectTimeout = setTimeout(() => {
      if (!this.isStale(gen)) {
        reject(new Error('Таймаут подключения к PeerJS Cloud'))
      }
    }, ms)
  }

  private parse(raw: unknown): WireMessage | null {
    try {
      return JSON.parse(String(raw)) as WireMessage
    } catch {
      return null
    }
  }

  private send(conn: DataConnection, msg: WireMessage) {
    if (conn.open) conn.send(msg)
  }

  private wireGuestConnection(
    conn: DataConnection,
    localPeerId: string,
    name: string,
  ) {
    this.hostConnection = conn

    conn.on('open', () => {
      this.send(conn, { type: 'HELLO', peerId: localPeerId, name })
    })

    conn.on('data', (raw) => {
      const msg = this.parse(raw)
      if (!msg || msg.type === 'HELLO') return
      const from = msg.type === 'ACTION' ? msg.from : 'host'
      this.onData(msg, from)
    })

    conn.on('close', () => {
      this.hostConnection = null
      this.onHostLost()
    })
  }

  private wireHostConnection(conn: DataConnection) {
    const remoteId = conn.peer

    conn.on('data', (raw) => {
      const msg = this.parse(raw)
      if (!msg) return

      if (msg.type === 'HELLO') {
        this.connections.set(msg.peerId, conn)
        this.onGuestJoined(msg.peerId, msg.name)
        return
      }

      const from = msg.type === 'ACTION' ? msg.from : remoteId
      this.onData(msg, from)
    })

    conn.on('close', () => {
      for (const [id, c] of this.connections) {
        if (c === conn) {
          this.connections.delete(id)
          this.onGuestLeft(id)
          break
        }
      }
    })
  }

  startAsHost(roomId: string): Promise<void> {
    const id = hostPeerId(roomId)
    const gen = ++this.generation

    return new Promise((resolve, reject) => {
      this.destroyInternal(false)

      const peer = new Peer(id, PEERJS_CONFIG)
      this.peer = peer

      this.armTimeout(gen, reject)

      const finish = (fn: () => void) => {
        if (this.isStale(gen)) return
        this.clearConnectTimeout()
        fn()
      }

      peer.on('open', () => {
        finish(() => resolve())
      })

      peer.on('error', (err) => {
        finish(() => {
          if (err.type === 'unavailable-id') {
            reject(
              new Error(
                'Комната уже занята — подождите минуту или выберите другой ID',
              ),
            )
          } else {
            reject(new Error(err.message || 'Ошибка PeerJS'))
          }
        })
      })

      peer.on('connection', (conn) => {
        if (!this.isStale(gen)) this.wireHostConnection(conn)
      })

      peer.on('disconnected', () => {
        if (!peer.destroyed && !this.isStale(gen)) peer.reconnect()
      })
    })
  }

  startAsGuest(roomId: string, localPeerId: string, name: string): Promise<void> {
    const targetId = hostPeerId(roomId)
    const gen = ++this.generation

    return new Promise((resolve, reject) => {
      this.destroyInternal(false)

      const peer = new Peer(localPeerId, PEERJS_CONFIG)
      this.peer = peer

      this.armTimeout(gen, reject)

      const finish = (fn: () => void) => {
        if (this.isStale(gen)) return
        this.clearConnectTimeout()
        fn()
      }

      peer.on('open', () => {
        if (this.isStale(gen)) return

        const conn = peer.connect(targetId, { reliable: true })
        this.wireGuestConnection(conn, localPeerId, name)

        conn.on('open', () => {
          finish(() => resolve())
        })

        conn.on('error', () => {
          finish(() =>
            reject(new Error('Не удалось подключиться к хосту комнаты')),
          )
        })
      })

      peer.on('error', (err) => {
        finish(() => {
          if (err.type === 'peer-unavailable') {
            reject(
              new Error('Комната не найдена — сначала создайте её или дождитесь хоста'),
            )
          } else if (err.type === 'unavailable-id') {
            reject(
              new Error('Конфликт Peer ID — очистите данные сайта и обновите страницу'),
            )
          } else {
            reject(new Error(err.message || 'Ошибка PeerJS'))
          }
        })
      })

      peer.on('disconnected', () => {
        if (!peer.destroyed && !this.isStale(gen)) peer.reconnect()
      })
    })
  }

  sendToHost(msg: DataMessage) {
    if (this.hostConnection?.open) this.send(this.hostConnection, msg)
  }

  sendToGuest(guestPeerId: string, msg: DataMessage) {
    const conn = this.connections.get(guestPeerId)
    if (conn) this.send(conn, msg)
  }

  broadcast(msg: DataMessage) {
    for (const conn of this.connections.values()) {
      this.send(conn, msg)
    }
  }

  private destroyInternal(bumpGeneration: boolean) {
    this.clearConnectTimeout()
    if (bumpGeneration) this.generation++

    this.hostConnection?.close()
    for (const conn of this.connections.values()) conn.close()
    this.connections.clear()
    this.hostConnection = null

    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy()
    }
    this.peer = null
  }

  destroy() {
    this.destroyInternal(true)
  }
}

export const peerManager = new PeerManager()
