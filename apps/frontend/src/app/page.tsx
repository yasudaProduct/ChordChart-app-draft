import Link from 'next/link'
import { SignedOut } from '@clerk/nextjs'
import { SiteHeader } from '@/components/layout/SiteHeader'

export const runtime = 'edge'

export default function Home() {
  return (
    <main className="min-h-screen">
      <SiteHeader variant="public" />

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            ChordBook MVP
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
            作りやすく、演奏しやすく。
            <span className="block font-display text-slate-700">
              あなたのコード譜を美しく管理。
            </span>
          </h1>
          <p className="text-lg text-slate-600">
            広告や煩雑さから解放されて、練習にも本番にも使えるコード譜を一冊に。
            編集・プレビュー・印刷までを一気通貫で。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              無料で始める
            </Link>
            <SignedOut>
              <Link
                href="/demo"
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                デモを見る
              </Link>
            </SignedOut>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] backdrop-blur">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>Editor Preview</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
              Live
            </span>
          </div>
          <div className="mt-6 space-y-4 font-mono text-sm text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Verse</p>
              <p>C G Am F</p>
              <p>きょうも いちにち がんばった</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Chorus</p>
              <p>| C | G | Am | F |</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: '直感的なエディタ',
              description: 'セクションごとに整理しながら、歌詞+コード/小節形式をスムーズに編集。',
            },
            {
              title: '演奏に最適化',
              description: 'リハでも本番でも見やすい、集中できるレイアウト。',
            },
            {
              title: '印刷・共有準備',
              description: '紙でもそのまま使える余白とレイアウトに対応。',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.6)] backdrop-blur"
            >
              <h3 className="font-display text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/60 bg-white/70 py-6 text-center text-xs text-slate-400">
        <p>&copy; 2026 ChordBook. Crafted for clean performances.</p>
      </footer>
    </main>
  )
}
