interface Props {
  label?: string
}

export function LoadingState({ label = 'Подключение…' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  )
}
