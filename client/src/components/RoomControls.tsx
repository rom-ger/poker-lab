interface Props {
  phase: 'voting' | 'revealed'
  isHost: boolean
  onReveal: () => void
  onReset: () => void
}

export function RoomControls({ phase, isHost, onReveal, onReset }: Props) {
  if (!isHost) {
    return (
      <p className="text-center text-sm text-zinc-500">
        {phase === 'voting'
          ? 'Карты откроются, когда все проголосуют'
          : 'Управление раундом — у хоста комнаты'}
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {phase === 'voting' && (
        <p className="text-center text-xs text-zinc-500">
          Карты откроются автоматически, когда все проголосуют
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {phase === 'voting' ? (
          <button
            type="button"
            onClick={onReveal}
            className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium transition hover:bg-violet-500"
          >
            Показать голоса
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-zinc-600 bg-zinc-800 px-6 py-3 text-sm font-medium transition hover:border-zinc-500"
          >
            Новый раунд
          </button>
        )}
      </div>
    </div>
  )
}
