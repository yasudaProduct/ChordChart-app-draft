type SongSearchInputProps = {
  query: string
  onChange: (query: string) => void
  resultCount: number
}

export const SongSearchInput = ({ query, onChange, resultCount }: SongSearchInputProps) => {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <input
        type="text"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="曲名・アーティストで検索"
        className="w-full rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none transition focus:border-slate-400 md:w-80"
      />
      <span className="text-xs text-slate-500">{resultCount} 件ヒット</span>
    </div>
  )
}
