import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SongListContent } from './SongListContent'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '楽曲一覧 | ChordBook',
  description: 'コード譜の一覧を表示します。',
}

export default function SongsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader variant="app" />

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900">楽曲一覧</h1>
            <p className="text-sm text-slate-500">直近の編集内容から一覧表示しています。</p>
          </div>
          <Link
            href="/songs/new"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + 新規作成
          </Link>
        </div>

        <SongListContent />
      </section>
    </main>
  )
}
