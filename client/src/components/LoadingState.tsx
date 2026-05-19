interface Props {
  label?: string
}

export function LoadingState({ label = 'Подключение к комнате…' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  )
}
