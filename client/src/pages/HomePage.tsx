import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoomId } from '../lib/roomId'
import { getStoredName, setStoredName } from '../lib/storage'

export function HomePage() {
  const navigate = useNavigate()
  const [name, setName] = useState(getStoredName())
  const [joinId, setJoinId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const goToRoom = (roomId: string, isCreator = false) => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Введите имя')
      return
    }
    setStoredName(trimmed)
    setError(null)
    const create = isCreator ? '&create=1' : ''
    navigate(`/room/${roomId}?name=${encodeURIComponent(trimmed)}${create}`)
  }

  const createRoom = () => goToRoom(generateRoomId(), true)

  const joinRoom = () => {
    const id = joinId.trim().toLowerCase()
    if (!id) {
      setError('Введите ID комнаты')
      return
    }
    goToRoom(id)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-12">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Planning Poker
        </h1>
      </div>

      <div className="panel mt-8 p-5">
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            maxLength={32}
            className="input-field"
          />

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <button type="button" onClick={createRoom} className="btn-primary w-full">
            Создать комнату
          </button>

          <div className="relative py-2 text-center text-xs text-slate-400">
            <span className="relative z-10 bg-white px-2">или</span>
            <div className="absolute inset-x-0 top-1/2 border-t border-slate-100" />
          </div>

          <input
            type="text"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="ID комнаты"
            className="input-field font-mono"
          />

          <button type="button" onClick={joinRoom} className="btn-secondary w-full">
            Войти
          </button>
        </div>
      </div>
    </main>
  )
}
