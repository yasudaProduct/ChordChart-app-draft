'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PerformanceMode } from '@/components/song/PerformanceMode'
import { SongPreview } from '@/components/song/SongPreview'
import { TransposeControl } from '@/components/song/TransposeControl'
import { transposeSong } from '@/lib/music'
import { songMetaLine } from '@/lib/songMeta'
import { songApi } from '@/lib/songApi'
import { useSong } from '@/hooks/useSong'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import type { Song } from '@/types/song'

type SongDetailContentProps = {
  id: string
  mode?: 'default' | 'demo'
  song?: Song | null
  isLoading?: boolean
  error?: unknown
}

export const SongDetailContent = ({
  id,
  mode = 'default',
  song: externalSong,
  isLoading: externalLoading,
  error: externalError,
}: SongDetailContentProps) => {
  const router = useRouter()
  const { requireAuth } = useRequireAuth()

  const fetched = useSong(mode === 'default' ? id : undefined)
  const song = externalSong !== undefined ? externalSong : fetched.song
  const isLoading = externalLoading !== undefined ? externalLoading : fetched.isLoading
  const error = externalError !== undefined ? externalError : fetched.error

  // 非破壊のビュー移調（保存されない・この画面と演奏モードのみに反映）
  const [transpose, setTranspose] = useState(0)
  const [isPerforming, setPerforming] = useState(false)
  const displaySong = useMemo(
    () => (song && transpose !== 0 ? transposeSong(song, transpose) : song),
    [song, transpose]
  )

  const isDemo = mode === 'demo'
  const editHref = isDemo ? `/demo/editor/${id}` : `/editor/${id}`
  const backHref = isDemo ? '/demo' : '/songs'

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-sm text-red-600">
        {error instanceof Error ? error.message : '読み込みに失敗しました'}
      </div>
    )
  }

  if (isLoading || !song || !displaySong) {
    return <div className="mx-auto max-w-4xl px-6 py-16 text-sm text-slate-500">読み込み中...</div>
  }

  const canEdit = isDemo || !!song.isOwner
  const canDelete = !isDemo && !!song.isOwner

  const handleEdit = () => {
    if (isDemo) {
      router.push(editHref)
    } else {
      requireAuth(() => router.push(editHref))
    }
  }

  const handleDelete = async () => {
    if (!confirm('この楽曲を削除しますか？')) return
    await songApi.remove(id)
    router.push(backHref)
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">{song.title}</h1>
          <p className="text-sm text-slate-500">{songMetaLine(displaySong)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setPerforming(true)}
            className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400"
          >
            ▶ 演奏モード
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              編集
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
          >
            印刷 / PDF
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50"
            >
              削除
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
          >
            一覧へ戻る
          </button>
        </div>
      </div>

      <div className="mt-4 print:hidden">
        <TransposeControl semitones={transpose} onChange={setTranspose} baseKey={song.key} />
      </div>

      <div className="mt-6 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] print:mt-2 print:border-none print:bg-white print:p-0 print:shadow-none">
        <SongPreview song={displaySong} />
      </div>

      {isPerforming && (
        <PerformanceMode
          song={song}
          initialTranspose={transpose}
          onClose={() => setPerforming(false)}
        />
      )}
    </section>
  )
}
