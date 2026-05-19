interface Props {
  average: number | null
}

export function AverageDisplay({ average }: Props) {
  if (average == null) return null

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-center">
      <p className="text-xs uppercase tracking-wider text-emerald-400/80">
        Среднее (числовые карты)
      </p>
      <p className="mt-1 text-3xl font-bold text-emerald-300">{average}</p>
    </div>
  )
}
