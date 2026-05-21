import { useState } from 'react'

interface Props {
  onAdd: (name: string) => void
}

export function AddFakePlayerForm({ onAdd }: Props) {
  const [name, setName] = useState('')

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <form
      className="mt-3 flex gap-2 border-t border-slate-100 pt-3"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Имя фейкового участника"
        maxLength={32}
        className="input-field min-w-0 flex-1 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="btn-secondary shrink-0 py-2 disabled:opacity-40"
      >
        Добавить
      </button>
    </form>
  )
}
