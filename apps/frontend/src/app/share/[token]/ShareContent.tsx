'use client'

import { SongPreview } from '@/components/song/SongPreview'
import { useSong } from '@/hooks/useSong'

type ShareContentProps = {
  token: string
}

export const ShareContent = ({ token }: ShareContentProps) => {
  const { song, error, isLoading } = useSong(token)

  if (error) {
    return (
      <div className="mt-6 text-sm text-red-600">
        {error instanceof Error ? error.message : '読み込みに失敗しました'}
      </div>
    )
  }

  if (isLoading || !song) {
    return <div className="mt-6 text-sm text-slate-500">読み込み中...</div>
  }

  return (
    <div className="mt-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{song.title}</h2>
        <p className="text-sm text-slate-500">
          {song.artist || 'アーティスト未設定'} · Key {song.key || '-'}
        </p>
      </div>
      <SongPreview song={song} />
    </div>
  )
}
