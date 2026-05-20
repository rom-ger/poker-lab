import type { ReactNode } from 'react'
import { useState } from 'react'
import { copyText, getShareableRoomUrl } from '../lib/copyText'

interface Props {
  roomId: string
  isHost: boolean
  actions?: ReactNode
}

export function Header({ roomId, isHost, actions }: Props) {
  const [copyHint, setCopyHint] = useState(false)

  const copyLink = async () => {
    const url = getShareableRoomUrl()
    const ok = await copyText(url)

    if (ok) {
      setCopyHint(true)
      setTimeout(() => setCopyHint(false), 2000)
    } else {
      window.prompt('Ссылка для гостей:', url)
    }
  }

  return (
    <header className="sticky top-0 z-10 -mx-4 border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display truncate text-base font-semibold text-slate-900">
              Planning Poker
            </h1>
            {isHost && (
              <span className="shrink-0 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-600">
                host
              </span>
            )}
          </div>
          <p className="truncate font-mono text-xs text-slate-400">
            {roomId}
            {copyHint && <span className="ml-2 text-indigo-500">скопировано</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={copyLink}
            className="btn-secondary !px-3 !py-1.5 text-xs"
          >
            Ссылка
          </button>
        </div>
      </div>
    </header>
  )
}
