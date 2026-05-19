import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AverageDisplay } from '../components/AverageDisplay'
import { CardDeck } from '../components/CardDeck'
import { ErrorBanner } from '../components/ErrorBanner'
import { Header } from '../components/Header'
import { LoadingState } from '../components/LoadingState'
import { PlayerList } from '../components/PlayerList'
import { RoomControls } from '../components/RoomControls'
import { useRoom } from '../hooks/useRoom'
import { calculateAverage } from '../lib/average'
import { getOrCreatePeerId } from '../lib/peerId'
import { isValidRoomId } from '../lib/roomId'
import type { CardValue } from '../types'

export function RoomPage() {
  const { roomId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const name = searchParams.get('name')?.trim() ?? ''
  const peerId = useMemo(() => getOrCreatePeerId(), [])

  if (!isValidRoomId(roomId)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-red-400">Некорректный ID комнаты</p>
        <Link to="/" className="mt-4 inline-block text-violet-400 hover:underline">
          На главную
        </Link>
      </main>
    )
  }

  if (!name) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-zinc-400">Укажите имя на главной странице</p>
        <Link to="/" className="mt-4 inline-block text-violet-400 hover:underline">
          На главную
        </Link>
      </main>
    )
  }

  const asCreator = searchParams.get('create') === '1'

  return (
    <RoomContent
      roomId={roomId}
      peerId={peerId}
      name={name}
      asCreator={asCreator}
    />
  )
}

function RoomContent({
  roomId,
  peerId,
  name,
  asCreator,
}: {
  roomId: string
  peerId: string
  name: string
  asCreator: boolean
}) {
  const room = useRoom(roomId, peerId, name, asCreator)
  const players = Object.values(room.players).sort((a, b) =>
    a.name.localeCompare(b.name),
  )
  const myPlayer = room.players[peerId]
  const average =
    room.phase === 'revealed' ? calculateAverage(players) : null

  const statusLabel =
    room.connectionStatus === 'connecting'
      ? 'Подключение…'
      : room.connectionStatus === 'reconnecting'
        ? 'Переподключение…'
        : undefined

  if (
    room.connectionStatus === 'connecting' ||
    room.connectionStatus === 'reconnecting' ||
    !myPlayer
  ) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <LoadingState label={statusLabel} />
      </main>
    )
  }

  if (room.connectionStatus === 'error') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <ErrorBanner
          message={room.error ?? 'Ошибка подключения'}
          onRetry={room.scheduleReconnect}
        />
        <Link to="/" className="mt-6 block text-center text-sm text-zinc-500 hover:text-zinc-300">
          На главную
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 pb-12">
      <Header roomId={roomId} isHost={room.isHost} />

      {room.connectionStatus === 'connected' && (
        <p className="mt-2 text-xs text-emerald-500/80">
          ● P2P · signaling: PeerJS Cloud
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Участники
        </h2>
        <PlayerList players={players} phase={room.phase} myId={peerId} />
      </section>

      {room.phase === 'revealed' && (
        <section className="mt-6">
          <AverageDisplay average={average} />
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Ваша оценка
        </h2>
        <CardDeck
          selected={myPlayer?.vote ?? null}
          disabled={room.phase !== 'voting'}
          onSelect={(value: CardValue) => room.vote({ type: 'VOTE', vote: value })}
        />
      </section>

      <section className="mt-8">
        <RoomControls
          phase={room.phase}
          isHost={room.isHost}
          onReveal={room.reveal}
          onReset={room.reset}
        />
      </section>
    </main>
  )
}
