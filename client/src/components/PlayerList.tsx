import type { CardValue, Player, VotePhase } from '../types'

interface Props {
  players: Player[]
  phase: VotePhase
  myId: string
}

function displayVote(vote: CardValue | null, phase: VotePhase): string {
  if (phase === 'voting') return vote != null ? '✓' : '—'
  if (vote === 'coffee') return '☕'
  if (vote === '?') return '?'
  return vote != null ? String(vote) : '—'
}

export function PlayerList({ players, phase, myId }: Props) {
  if (players.length === 0) {
    return (
      <p className="text-center text-sm text-zinc-500">Пока никого нет в комнате</p>
    )
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {players.map((p) => {
        const voted = p.hasVoted
        const showVote = phase === 'revealed' || p.id === myId

        return (
          <li
            key={p.id}
            className={[
              'flex items-center justify-between rounded-xl border px-4 py-3 transition',
              p.id === myId ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-800 bg-zinc-900/50',
              !p.connected && 'opacity-50',
            ].join(' ')}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {p.name}
                {p.id === myId && (
                  <span className="ml-1 text-xs text-zinc-500">(вы)</span>
                )}
              </p>
              <p className="text-xs text-zinc-500">
                {!p.connected
                  ? 'переподключение…'
                  : voted
                    ? 'проголосовал'
                    : 'голосует…'}
              </p>
            </div>
            <div
              className={[
                'flex h-12 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition',
                voted && phase === 'voting'
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : 'border-zinc-700 bg-zinc-800',
              ].join(' ')}
            >
              {showVote ? displayVote(p.vote, phase) : voted ? '✓' : '·'}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
