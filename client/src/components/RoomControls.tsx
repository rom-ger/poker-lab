interface Props {
  phase: 'voting' | 'revealed'
  isHost: boolean
  onReveal: () => void
  onReset: () => void
}

export function RoomControls({ phase, isHost, onReveal, onReset }: Props) {
  if (!isHost) return null

  if (phase === 'voting') {
    return (
      <button type="button" onClick={onReveal} className="btn-primary shrink-0">
        Показать голоса
      </button>
    )
  }

  return (
    <button type="button" onClick={onReset} className="btn-primary shrink-0">
      Новый раунд
    </button>
  )
}
