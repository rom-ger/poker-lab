interface Props {
  roomId: string
  isHost: boolean
}

export function Header({ roomId, isHost }: Props) {
  const url = window.location.href

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
  }

  return (
    <header className="flex flex-col gap-3 border-b border-zinc-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Planning Poker</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Комната <span className="font-mono text-violet-300">{roomId}</span>
          {isHost && (
            <span className="ml-2 rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
              host
            </span>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm transition hover:border-violet-500/50 hover:bg-zinc-800"
      >
        Скопировать ссылку
      </button>
    </header>
  )
}
