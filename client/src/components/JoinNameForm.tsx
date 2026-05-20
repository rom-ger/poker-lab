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
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-12">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">Вход</h1>
        <p className="mt-1 font-mono text-sm text-slate-400">{roomId}</p>
      </div>

      <div className="panel mt-6 p-5">
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && join()}
            placeholder="Ваше имя"
            maxLength={32}
            autoFocus
            className="input-field"
          />

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <button type="button" onClick={join} className="btn-primary w-full">
            Войти
          </button>
        </div>
      </div>
    </main>
  )
}
