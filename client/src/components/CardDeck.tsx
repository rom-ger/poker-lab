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
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
      {CARD_VALUES.map((value) => {
        const isSelected = selected === value
        return (
          <button
            key={String(value)}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(value)}
            className={[
              'group relative flex aspect-[2/3] items-center justify-center rounded-xl border text-lg font-semibold transition-all duration-200',
              'hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/20 active:scale-95',
              disabled && 'pointer-events-none opacity-40',
              isSelected
                ? 'border-violet-400 bg-violet-600/30 shadow-lg shadow-violet-500/30 scale-105'
                : 'border-zinc-700 bg-zinc-900/80 hover:border-violet-500/60',
            ].join(' ')}
          >
            <span className="transition group-hover:scale-110">{label(value)}</span>
          </button>
        )
      })}
    </div>
  )
}
