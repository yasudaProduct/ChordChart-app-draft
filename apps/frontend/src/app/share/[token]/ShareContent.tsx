'use client'

import { useMemo, useState } from 'react'
import { ChordSheet } from '@/components/song/ChordSheet'
import { PerformanceMode } from '@/components/song/PerformanceMode'
import { TransposeControl } from '@/components/song/TransposeControl'
import { transposeSong } from '@/lib/music'
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
    <div className="mt-6 print:mt-0">
      {/* 曲名・メタ情報は譜面（ChordSheet）側に出すため、ここは操作ボタンのみ */}
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3 print:hidden">
        <button
          type="button"
          onClick={() => setPerforming(true)}
          className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400"
        >
          ▶ 演奏モード
        </button>
      </div>

      <div className="mb-4 print:hidden">
        <TransposeControl semitones={transpose} onChange={setTranspose} baseKey={song.key} />
      </div>

      <ChordSheet song={displaySong} />

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
