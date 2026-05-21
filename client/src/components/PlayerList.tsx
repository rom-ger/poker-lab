import { useState } from 'react'
import type { CardValue, Player, VotePhase } from '../types'
import { VotePickerPopover } from './VotePickerPopover'

interface Props {
  players: Player[]
  phase: VotePhase
  myId: string
  isHost?: boolean
  onRemove?: (playerId: string) => void
  onSetVote?: (playerId: string, vote: CardValue | null) => void
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function displayVote(vote: CardValue | null, phase: VotePhase): string {
  if (phase === 'voting') return vote != null ? '✓' : '·'
  if (vote === 'coffee') return '☕'
  if (vote === '?') return '?'
  return vote != null ? String(vote) : '—'
}

export function PlayerList({
  players,
  phase,
  myId,
  isHost = false,
  onRemove,
  onSetVote,
}: Props) {
  const [editingVoteFor, setEditingVoteFor] = useState<string | null>(null)

  if (players.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">Пока никого нет</p>
    )
  }

  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {players.map((p) => {
        const voted = p.hasVoted
        const showVote = phase === 'revealed' || p.id === myId
        const canRemove = isHost && p.id !== myId && onRemove
        const canSetVote =
          isHost && phase === 'voting' && p.id !== myId && onSetVote
        const isMe = p.id === myId
        const isEditing = editingVoteFor === p.id

        return (
          <li
            key={p.id}
            className={[
              'relative flex items-center gap-2.5 rounded-lg border px-2.5 py-2',
              isMe ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-100 bg-slate-50/50',
              p.isFake && 'border-dashed',
              !p.connected && !p.isFake && 'opacity-40',
            ].join(' ')}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${avatarColor(p.name)}`}
            >
              {initials(p.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-800">{p.name}</p>
              {p.isFake && (
                <p className="text-[10px] text-slate-400">фейковый</p>
              )}
            </div>
            <div className="relative">
              {canSetVote ? (
                <button
                  type="button"
                  onClick={() => setEditingVoteFor(isEditing ? null : p.id)}
                  title="Указать карту голоса"
                  className={[
                    'flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition',
                    voted
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300'
                      : 'border-slate-100 bg-white text-slate-300 hover:border-indigo-200 hover:text-indigo-400',
                    isEditing && 'ring-1 ring-indigo-400',
                  ].join(' ')}
                >
                  {voted ? '✓' : '·'}
                </button>
              ) : (
                <div
                  className={[
                    'flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-md border text-xs font-semibold',
                    showVote && phase === 'revealed'
                      ? 'border-slate-200 bg-white text-slate-800'
                      : voted
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : 'border-slate-100 bg-white text-slate-300',
                  ].join(' ')}
                >
                  {showVote ? displayVote(p.vote, phase) : voted ? '✓' : '·'}
                </div>
              )}
              {isEditing && onSetVote && (
                <VotePickerPopover
                  current={p.vote}
                  onSelect={(vote) => onSetVote(p.id, vote)}
                  onClose={() => setEditingVoteFor(null)}
                />
              )}
            </div>
            {canRemove && (
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                title="Удалить"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                ×
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
