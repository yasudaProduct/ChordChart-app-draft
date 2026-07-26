'use client'

import { useMemo, useState } from 'react'
import { SongCard } from '@/components/song/SongCard'
import { SongSearchInput } from '@/components/song/SongSearchInput'
import { useSongListForMode } from '@/hooks/useSong'

type SongListContentProps = {
  mode?: 'default' | 'demo'
}

export const SongListContent = ({ mode = 'default' }: SongListContentProps) => {
  const { songs, error, isLoading } = useSongListForMode(mode)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return songs
    const lower = query.toLowerCase()
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(lower) ||
        (song.artist ?? '').toLowerCase().includes(lower)
    )
  }, [songs, query])

  return (
    <>
      <SongSearchInput query={query} onChange={setQuery} resultCount={filtered.length} />

      <div className="mt-8 grid gap-4">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
            読み込み中...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
            {error instanceof Error ? error.message : '読み込みに失敗しました'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
            まだ楽曲がありません。
          </div>
        ) : (
          filtered.map((song) => (
            <SongCard key={song.id} song={song} mode={mode} showActions={mode === 'demo'} />
          ))
        )}
      </div>
    </>
  )
}
