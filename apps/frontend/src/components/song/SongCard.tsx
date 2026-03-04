'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import type { SongListItem } from '@/types/song'

type SongCardProps = {
  song: SongListItem
  onDelete: (id: string) => void
}

const formatDate = (value: string) => {
  const date = new Date(value)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate()
  ).padStart(2, '0')}`
}

export const SongCard = ({ song, onDelete }: SongCardProps) => {
  const session = useAuthStore((s) => s.session)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.6)]">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{song.title}</h2>
        <p className="text-sm text-slate-500">
          {song.artist || 'アーティスト未設定'} · Key {song.key || '-'} · 更新{' '}
          {formatDate(song.updatedAt)}
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={`/songs/${song.id}`}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
        >
          詳細
        </Link>
        {session && (
          <>
            <Link
              href={`/editor/${song.id}`}
              className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              編集
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(song.id)}
              className="rounded-full px-3 py-1 text-xs font-semibold"
            >
              削除
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
