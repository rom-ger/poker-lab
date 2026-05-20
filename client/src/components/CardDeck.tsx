import { CARD_VALUES, type CardValue } from '../types'

interface Props {
  selected: CardValue | null
  disabled: boolean
  onSelect: (value: CardValue) => void
}

function label(value: CardValue): string {
  if (value === 'coffee') return '☕'
  return String(value)
}

export function CardDeck({ selected, disabled, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-1.5 lg:grid-cols-[repeat(14,minmax(0,1fr))] lg:gap-1">
      {CARD_VALUES.map((value) => {
        const isSelected = selected === value
        const isSpecial = value === 'coffee' || value === '?'

        return (
          <button
            key={String(value)}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(value)}
            className={[
              'flex h-12 items-center justify-center rounded-lg border font-semibold transition sm:h-10 sm:rounded-md',
              isSpecial ? 'text-base sm:text-sm' : 'text-sm sm:text-xs',
              disabled && 'pointer-events-none opacity-35',
              isSelected
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 active:bg-indigo-50',
            ].join(' ')}
          >
            {label(value)}
          </button>
        )
      })}
    </div>
  )
}
