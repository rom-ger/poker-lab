import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredName, setStoredName } from '../lib/storage'

interface Props {
  roomId: string
}

export function JoinNameForm({ roomId }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState(getStoredName())
  const [error, setError] = useState<string | null>(null)

  const join = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Введите имя')
      return
    }
    setStoredName(trimmed)
    navigate(`/room/${roomId}?name=${encodeURIComponent(trimmed)}`, {
      replace: true,
    })
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-center text-2xl font-bold">Вход в комнату</h1>
      <p className="mt-2 text-center text-sm text-zinc-400">
        ID: <span className="font-mono text-violet-300">{roomId}</span>
      </p>

      <div className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm text-zinc-400">Ваше имя</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && join()}
            placeholder="Алексей"
            maxLength={32}
            autoFocus
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
          onClick={join}
          className="w-full rounded-xl bg-violet-600 py-3 font-medium transition hover:bg-violet-500"
        >
          Войти
        </button>
      </div>
    </main>
  )
}
