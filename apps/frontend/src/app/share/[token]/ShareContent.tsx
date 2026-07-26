'use client'

import { useMemo, useState } from 'react'
import { PerformanceMode } from '@/components/song/PerformanceMode'
import { SongPreview } from '@/components/song/SongPreview'
import { TransposeControl } from '@/components/song/TransposeControl'
import { transposeSong } from '@/lib/music'
import { songMetaLine } from '@/lib/songMeta'
import { useSharedSong } from '@/hooks/useSong'

type ShareContentProps = {
  token: string
}

export const ShareContent = ({ token }: ShareContentProps) => {
  const { song, error, isLoading } = useSharedSong(token)

  // 非破壊のビュー移調（保存されない・この画面と演奏モードのみに反映）
  const [transpose, setTranspose] = useState(0)
  const [isPerforming, setPerforming] = useState(false)
  const displaySong = useMemo(
    () => (song && transpose !== 0 ? transposeSong(song, transpose) : song),
    [song, transpose]
  )

  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        この共有リンクは無効か、有効期限が切れています。共有した人に新しいリンクを発行してもらってください。
      </div>
    )
  }

  if (isLoading || !song || !displaySong) {
    return <div className="mt-6 text-sm text-slate-500">読み込み中...</div>
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{song.title}</h2>
          <p className="text-sm text-slate-500">{songMetaLine(displaySong)}</p>
        </div>
        <button
          type="button"
          onClick={() => setPerforming(true)}
          className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400 print:hidden"
        >
          ▶ 演奏モード
        </button>
      </div>

      <div className="mb-4 print:hidden">
        <TransposeControl semitones={transpose} onChange={setTranspose} baseKey={song.key} />
      </div>

      <SongPreview song={displaySong} />

      {isPerforming && (
        <PerformanceMode
          song={song}
          initialTranspose={transpose}
          onClose={() => setPerforming(false)}
        />
      )}
    </div>
  )
}
