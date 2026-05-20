import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AverageDisplay } from '../components/AverageDisplay'
import { CardDeck } from '../components/CardDeck'
import { ErrorBanner } from '../components/ErrorBanner'
import { JoinNameForm } from '../components/JoinNameForm'
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
        <p className="text-red-500">Некорректный ID комнаты</p>
        <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline">
          На главную
        </Link>
      </main>
    )
  }

  if (!name) {
    return <JoinNameForm roomId={roomId} />
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

  const [syncTimedOut, setSyncTimedOut] = useState(false)

  useEffect(() => {
    if (myPlayer) {
      setSyncTimedOut(false)
      return
    }
    if (
      room.connectionStatus === 'connecting' ||
      room.connectionStatus === 'reconnecting'
    ) {
      return
    }
    const timer = setTimeout(() => setSyncTimedOut(true), 8000)
    return () => clearTimeout(timer)
  }, [myPlayer, room.connectionStatus])

  if (
    room.connectionStatus === 'connecting' ||
    room.connectionStatus === 'reconnecting'
  ) {
    const label =
      room.connectionStatus === 'reconnecting'
        ? 'Переподключение…'
        : 'Подключение…'
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <LoadingState label={label} />
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
        <Link to="/" className="mt-6 block text-center text-sm text-slate-400 hover:text-slate-600">
          На главную
        </Link>
      </main>
    )
  }

  if (!myPlayer) {
    if (syncTimedOut) {
      return (
        <main className="mx-auto max-w-3xl px-4 py-8">
          <ErrorBanner
            message="Не удалось войти в комнату. Проверьте, что хост онлайн, или создайте комнату заново."
            onRetry={room.scheduleReconnect}
          />
          <Link to="/" className="mt-6 block text-center text-sm text-slate-400 hover:text-slate-600">
            На главную
          </Link>
        </main>
      )
    }

    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <LoadingState label="Синхронизация…" />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-8">
      <Header
        roomId={roomId}
        isHost={room.isHost}
        actions={
          <RoomControls
            phase={room.phase}
            isHost={room.isHost}
            onReveal={room.reveal}
            onReset={room.reset}
          />
        }
      />

      <section className="panel mt-5 p-4">
        <CardDeck
          selected={myPlayer?.vote ?? null}
          disabled={room.phase !== 'voting'}
          onSelect={(value: CardValue) => room.vote({ type: 'VOTE', vote: value })}
        />
      </section>

      {room.phase === 'revealed' && average != null && (
        <div className="mt-3 flex justify-center">
          <AverageDisplay average={average} />
        </div>
      )}

      <section className="panel mt-4 p-3">
        <PlayerList
          players={players}
          phase={room.phase}
          myId={peerId}
          isHost={room.isHost}
          onRemove={room.isHost ? room.removePlayer : undefined}
        />
      </section>
    </main>
  )
}
