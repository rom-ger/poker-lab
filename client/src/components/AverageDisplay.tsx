interface Props {
  average: number | null
}

export function AverageDisplay({ average }: Props) {
  if (average == null) return null

  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
      <span className="text-indigo-400">Ø</span>
      {average}
    </div>
  )
}
