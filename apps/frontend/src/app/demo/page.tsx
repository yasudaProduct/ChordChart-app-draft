import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SongListContent } from '@/app/songs/SongListContent'

export const metadata: Metadata = {
  title: 'デモ | ChordBook',
  description: '登録不要でChordBookの機能を体験できます。',
}

export default function DemoPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader variant="public" />

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900">デモ</h1>
            <p className="text-sm text-slate-500">
              登録不要で閲覧・編集を体験できます。編集内容はブラウザに保存されます。
            </p>
          </div>
        </div>

        <SongListContent mode="demo" />
      </section>
    </main>
  )
}
