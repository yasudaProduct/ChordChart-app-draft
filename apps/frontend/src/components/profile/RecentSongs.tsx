'use client'

import Link from 'next/link'
import { SongCard } from '@/components/song/SongCard'
import { useMyRecentSongs } from '@/hooks/useMe'

export const RecentSongs = () => {
  const { songs, error, isLoading } = useMyRecentSongs(5)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-slate-900">最近編集した曲</h2>
        <Link
          href="/profile/songs"
          className="text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          すべての楽曲を見る
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
          読み込み中...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
          楽曲の取得に失敗しました。
        </div>
      ) : songs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
          まだ楽曲がありません。
        </div>
      ) : (
        <div className="grid gap-4">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}
    </section>
  )
}
