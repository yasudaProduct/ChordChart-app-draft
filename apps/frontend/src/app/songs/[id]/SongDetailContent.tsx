'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SongPreview } from '@/components/song/SongPreview'
import { useSong } from '@/hooks/useSong'
import { useAuthStore } from '@/stores/authStore'

type SongDetailContentProps = {
  id: string
}

export const SongDetailContent = ({ id }: SongDetailContentProps) => {
  const router = useRouter()
  const { song, error, isLoading } = useSong(id)
  const session = useAuthStore((s) => s.session)

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-sm text-red-600">
        {error instanceof Error ? error.message : '読み込みに失敗しました'}
      </div>
    )
  }

  if (isLoading || !song) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-sm text-slate-500">
        読み込み中...
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            {song.title}
          </h1>
          <p className="text-sm text-slate-500">
            {song.artist || 'アーティスト未設定'} · Key {song.key || '-'} · BPM{' '}
            {song.bpm ?? '-'} · {song.timeSignature}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {session && (
            <Link
              href={`/editor/${song.id}`}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              編集
            </Link>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
          >
            印刷
          </button>
          <button
            type="button"
            onClick={() => router.push('/songs')}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
          >
            一覧へ戻る
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] print:border-none print:bg-white print:shadow-none">
        <SongPreview song={song} />
      </div>
    </section>
  )
}
