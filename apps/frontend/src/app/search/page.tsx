'use client'

export const runtime = 'edge'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { useSongSearch } from '@/hooks/useSong'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { results, isLoading } = useSongSearch(debouncedQuery)

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(value)
    }, 300)
  }

  return (
    <main className="min-h-screen">
      <SiteHeader variant="app" />
      <section className="mx-auto w-full max-w-5xl px-6 py-10">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">検索</h1>
          <p className="text-sm text-slate-500">
            公開楽曲の検索画面（MVPでは全件から検索できます）。
          </p>
        </div>

        <div className="mt-6">
          <input
            type="text"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="曲名・アーティストで検索"
            className="w-full rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none transition focus:border-slate-400"
          />
        </div>

        <div className="mt-8 grid gap-4">
          {!debouncedQuery.trim() ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
              曲名・アーティストを入力して検索してください。
            </div>
          ) : isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
              読み込み中...
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
              検索結果がありません。
            </div>
          ) : (
            results.map((song) => (
              <div
                key={song.id}
                className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.6)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{song.title}</h2>
                    <p className="text-sm text-slate-500">
                      {song.artist || 'アーティスト未設定'} · Key {song.key || '-'}
                    </p>
                  </div>
                  <Link
                    href={`/songs/${song.id}`}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    詳細を見る
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
