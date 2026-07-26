import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ShareContent } from './ShareContent'

export const runtime = 'edge'

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
      <section className="mx-auto max-w-4xl px-6 py-10 print:p-0">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] print:border-none print:bg-white print:p-0 print:shadow-none">
          {/* 案内バナーは印刷には不要（印刷対象は譜面のみ） */}
          <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900">共有コード譜</h1>
              <p className="text-sm text-slate-500">
                共有リンクから閲覧しています。ログインすると自分のコード譜も作成できます。
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 print:hidden"
            >
              ログインして始める
            </Link>
          </div>

          <ShareContent token={token} />
        </div>
      </section>
    </main>
  )
}
