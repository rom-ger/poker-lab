import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoomId } from '../lib/roomId'
import { getStoredName, setStoredName } from '../lib/storage'

export function HomePage() {
  const navigate = useNavigate()
  const [name, setName] = useState(getStoredName())
  const [joinId, setJoinId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const goToRoom = (roomId: string) => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Введите имя')
      return
    }
    setStoredName(trimmed)
    setError(null)
    navigate(`/room/${roomId}?name=${encodeURIComponent(trimmed)}`)
  }

  const createRoom = () => goToRoom(generateRoomId())

  const joinRoom = () => {
    const id = joinId.trim().toLowerCase()
    if (!id) {
      setError('Введите ID комнаты')
      return
    }
    goToRoom(id)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Planning Poker</h1>
        <p className="mt-2 text-zinc-400">
          Peer-to-peer оценка задач без сервера состояния
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <label className="block">
          <span className="text-sm text-zinc-400">Ваше имя</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Алексей"
            maxLength={32}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none transition focus:border-violet-500"
          />
        </label>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={createRoom}
          className="w-full rounded-xl bg-violet-600 py-3 font-medium transition hover:bg-violet-500"
        >
          Создать комнату
        </button>

        <div className="relative py-2 text-center text-xs text-zinc-600">
          <span className="bg-zinc-950 px-2">или</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-zinc-800" />
        </div>

        <label className="block">
          <span className="text-sm text-zinc-400">ID комнаты</span>
          <input
            type="text"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="abc12xyz"
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-mono outline-none transition focus:border-violet-500"
          />
        </label>

        <button
          type="button"
          onClick={joinRoom}
          className="w-full rounded-xl border border-zinc-600 bg-zinc-900 py-3 font-medium transition hover:border-violet-500/50"
        >
          Войти в комнату
        </button>
      </div>
    </main>
  )
}
