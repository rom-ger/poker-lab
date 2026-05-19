import { ICE_SERVERS } from './constants'
import type { DataMessage } from '../types'

export type DataHandler = (msg: DataMessage, fromPeerId: string) => void

interface PeerConnection {
  pc: RTCPeerConnection
  dc: RTCDataChannel | null
}

export class WebRTCManager {
  private connections = new Map<string, PeerConnection>()
  private roomId = ''
  private selfId = ''
  private isHost = false
  private onData: DataHandler = () => {}
  private onPeerConnected: (peerId: string) => void = () => {}
  private sendSignal: (msg: Record<string, unknown>) => void = () => {}

  configure(opts: {
    roomId: string
    selfId: string
    isHost: boolean
    onData: DataHandler
    onPeerConnected?: (peerId: string) => void
    sendSignal: (msg: Record<string, unknown>) => void
  }) {
    this.roomId = opts.roomId
    this.selfId = opts.selfId
    this.isHost = opts.isHost
    this.onData = opts.onData
    this.onPeerConnected = opts.onPeerConnected ?? (() => {})
    this.sendSignal = opts.sendSignal
  }

  setHost(isHost: boolean) {
    this.isHost = isHost
  }

  private createPC(remoteId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    const entry: PeerConnection = { pc, dc: null }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendSignal({
          type: 'ice',
          roomId: this.roomId,
          from: this.selfId,
          to: remoteId,
          candidate: e.candidate.toJSON(),
        })
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        pc.restartIce()
      }
    }

    if (this.isHost) {
      const dc = pc.createDataChannel('poker', { ordered: true })
      this.wireChannel(dc, remoteId, entry)
    } else {
      pc.ondatachannel = (e) => {
        this.wireChannel(e.channel, remoteId, entry)
      }
    }

    this.connections.set(remoteId, entry)
    return pc
  }

  private wireChannel(
    dc: RTCDataChannel,
    remoteId: string,
    entry: PeerConnection,
  ) {
    entry.dc = dc
    dc.onopen = () => this.onPeerConnected(remoteId)
    dc.onmessage = (e) => {
      try {
        const msg = JSON.parse(String(e.data)) as DataMessage
        this.onData(msg, remoteId)
      } catch {
        /* ignore malformed */
      }
    }
  }

  async connectAsHost(remoteId: string) {
    if (!this.isHost || this.connections.has(remoteId)) return
    const pc = this.createPC(remoteId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    this.sendSignal({
      type: 'offer',
      roomId: this.roomId,
      from: this.selfId,
      to: remoteId,
      sdp: offer,
    })
  }

  async handleOffer(from: string, sdp: RTCSessionDescriptionInit) {
    let entry = this.connections.get(from)
    if (!entry) {
      const pc = this.createPC(from)
      entry = this.connections.get(from)!
      await pc.setRemoteDescription(sdp)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      this.sendSignal({
        type: 'answer',
        roomId: this.roomId,
        from: this.selfId,
        to: from,
        sdp: answer,
      })
    }
  }

  async handleAnswer(from: string, sdp: RTCSessionDescriptionInit) {
    const entry = this.connections.get(from)
    if (entry) await entry.pc.setRemoteDescription(sdp)
  }

  async handleIce(from: string, candidate: RTCIceCandidateInit) {
    const entry = this.connections.get(from)
    if (entry) {
      try {
        await entry.pc.addIceCandidate(candidate)
      } catch {
        /* may arrive before remote description */
      }
    }
  }

  send(to: string, msg: DataMessage) {
    const entry = this.connections.get(to)
    if (entry?.dc?.readyState === 'open') {
      entry.dc.send(JSON.stringify(msg))
    }
  }

  broadcast(msg: DataMessage) {
    for (const [peerId] of this.connections) {
      if (peerId !== this.selfId) this.send(peerId, msg)
    }
  }

  broadcastToAll(msg: DataMessage) {
    for (const [peerId] of this.connections) {
      this.send(peerId, msg)
    }
  }

  closePeer(peerId: string) {
    const entry = this.connections.get(peerId)
    if (entry) {
      entry.dc?.close()
      entry.pc.close()
      this.connections.delete(peerId)
    }
  }

  closeAll() {
    for (const [, entry] of this.connections) {
      entry.dc?.close()
      entry.pc.close()
    }
    this.connections.clear()
  }

  getConnectedPeerIds(): string[] {
    return [...this.connections.keys()].filter((id) => {
      const dc = this.connections.get(id)?.dc
      return dc?.readyState === 'open'
    })
  }
}

export const webrtcManager = new WebRTCManager()
