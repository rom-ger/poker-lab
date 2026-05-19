import Peer, { type DataConnection } from 'peerjs'
import { createPeerOptions, hostPeerId } from './constants'
import type { DataMessage, RoomState, WireMessage } from '../types'

export type DataHandler = (msg: DataMessage, fromPeerId: string) => void

const ICE_FAILED_MSG =
  'P2P не установился (NAT или firewall). Попробуйте одну Wi‑Fi сеть или настройте TURN (см. README).'

export class PeerManager {
  private peer: Peer | null = null
  private connections = new Map<string, DataConnection>()
  private hostConnection: DataConnection | null = null
  private generation = 0
  private connectTimeout: ReturnType<typeof setTimeout> | null = null
  private statePollInterval: ReturnType<typeof setInterval> | null = null
  private onData: DataHandler = () => {}
  private onGuestJoined = (_peerId: string, _name: string) => {}
  private onGuestLeft = (_peerId: string) => {}
  private onHostLost = () => {}
  private onRequestState: () => RoomState | null = () => null
  private onIceFailed = () => {}

  configure(handlers: {
    onData: DataHandler
    onGuestJoined?: (peerId: string, name: string) => void
    onGuestLeft?: (peerId: string) => void
    onHostLost?: () => void
    onRequestState?: () => RoomState | null
    onIceFailed?: () => void
  }) {
    this.onData = handlers.onData
    this.onGuestJoined = handlers.onGuestJoined ?? (() => {})
    this.onGuestLeft = handlers.onGuestLeft ?? (() => {})
    this.onHostLost = handlers.onHostLost ?? (() => {})
    this.onRequestState = handlers.onRequestState ?? (() => null)
    this.onIceFailed = handlers.onIceFailed ?? (() => {})
  }

  private watchIce(
    conn: DataConnection,
    onFail: () => void,
  ) {
    const pc = conn.peerConnection
    if (!pc) return

    const check = () => {
      const state = pc.iceConnectionState
      if (state === 'failed' || state === 'closed') {
        onFail()
      }
    }

    pc.addEventListener('iceconnectionstatechange', check)
    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'failed') onFail()
    })
    check()
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

  private clearStatePoll() {
    if (this.statePollInterval) {
      clearInterval(this.statePollInterval)
      this.statePollInterval = null
    }
  }

  private armTimeout(gen: number, reject: (e: Error) => void, ms = 25000) {
    this.clearConnectTimeout()
    this.connectTimeout = setTimeout(() => {
      if (!this.isStale(gen)) {
        reject(new Error('Таймаут подключения к PeerJS Cloud'))
      }
    }, ms)
  }

  private parse(raw: unknown): WireMessage | null {
    if (raw && typeof raw === 'object' && 'type' in raw) {
      return raw as WireMessage
    }
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as WireMessage
      } catch {
        return null
      }
    }
    return null
  }

  private send(conn: DataConnection, msg: WireMessage) {
    if (conn.open) conn.send(msg)
  }

  private sendStateTo(conn: DataConnection) {
    const state = this.onRequestState()
    if (state) this.send(conn, { type: 'STATE', payload: state })
  }

  private wireGuestConnection(
    conn: DataConnection,
    localPeerId: string,
    name: string,
  ) {
    this.hostConnection = conn

    const sendHello = () => {
      this.send(conn, { type: 'HELLO', peerId: localPeerId, name })
    }

    const requestState = () => {
      this.send(conn, { type: 'REQUEST_STATE', peerId: localPeerId })
    }

    conn.on('open', () => {
      sendHello()
      requestState()
      setTimeout(sendHello, 500)
      setTimeout(requestState, 500)

      this.clearStatePoll()
      this.statePollInterval = setInterval(requestState, 1500)
    })

    conn.on('data', (raw) => {
      const msg = this.parse(raw)
      if (!msg || msg.type === 'HELLO' || msg.type === 'REQUEST_STATE') return

      if (msg.type === 'STATE') {
        this.clearStatePoll()
      }

      const from = msg.type === 'ACTION' ? msg.from : 'host'
      this.onData(msg, from)
    })

    conn.on('close', () => {
      this.clearStatePoll()
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
        this.sendStateTo(conn)
        return
      }

      if (msg.type === 'REQUEST_STATE') {
        this.sendStateTo(conn)
        return
      }

      if (msg.type === 'STATE' || msg.type === 'ACTION') {
        const from = msg.type === 'ACTION' ? msg.from : remoteId
        this.onData(msg, from)
      }
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

      const peer = new Peer(id, createPeerOptions())
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

      const peer = new Peer(localPeerId, createPeerOptions())
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

        let settled = false
        const settle = (fn: () => void) => {
          if (settled || this.isStale(gen)) return
          settled = true
          finish(fn)
        }

        this.watchIce(conn, () => {
          this.onIceFailed()
          settle(() => reject(new Error(ICE_FAILED_MSG)))
        })

        conn.on('open', () => {
          settle(() => resolve())
        })

        conn.on('error', () => {
          settle(() =>
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

  closePeer(peerId: string) {
    const conn = this.connections.get(peerId)
    if (conn) {
      conn.close()
      this.connections.delete(peerId)
    }
  }

  private destroyInternal(bumpGeneration: boolean) {
    this.clearConnectTimeout()
    this.clearStatePoll()
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
