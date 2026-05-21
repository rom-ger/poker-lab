import { useEffect, useRef } from 'react'
import { CARD_VALUES, type CardValue } from '../types'

interface Props {
  current: CardValue | null
  onSelect: (value: CardValue | null) => void
  onClose: () => void
}

function label(value: CardValue): string {
  if (value === 'coffee') return '☕'
  return String(value)
}

export function VotePickerPopover({ current, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
    >
      <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Карта голоса
      </p>
      <div className="grid grid-cols-4 gap-1">
        {CARD_VALUES.map((value) => {
          const isSelected = current === value
          return (
            <button
              key={String(value)}
              type="button"
              onClick={() => {
                onSelect(isSelected ? null : value)
                onClose()
              }}
              className={[
                'flex h-8 items-center justify-center rounded border text-xs font-semibold transition',
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50',
              ].join(' ')}
            >
              {label(value)}
            </button>
          )
        })}
      </div>
      {current != null && (
        <button
          type="button"
          onClick={() => {
            onSelect(null)
            onClose()
          }}
          className="mt-1.5 w-full rounded border border-slate-200 py-1 text-[11px] text-slate-500 hover:bg-slate-50"
        >
          Сбросить голос
        </button>
      )}
    </div>
  )
}
