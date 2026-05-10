import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ShareContent } from './ShareContent'

export const metadata: Metadata = {
  title: '共有コード譜 | ChordBook',
  description: '共有されたコード譜を閲覧できます。',
}

type SharePageProps = {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params

  return (
    <main className="min-h-screen">
      <SiteHeader variant="public" />
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900">共有コード譜</h1>
              <p className="text-sm text-slate-500">
                このページはURL共有で閲覧できる想定です（MVP）。
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
            >
              ログインして編集
            </Link>
          </div>

          <ShareContent token={token} />
        </div>
      </section>
    </main>
  )
}
