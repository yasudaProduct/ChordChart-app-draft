'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { songApi } from '@/lib/songApi'
import { useAuthStore } from '@/stores/authStore'
import { KEYS, TIME_SIGNATURES } from '@/lib/utils'

export default function NewSongPage() {
  const router = useRouter()
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [key, setKey] = useState('C')
  const [bpm, setBpm] = useState<number | ''>(120)
  const [timeSignature, setTimeSignature] = useState('4/4')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    const song = await songApi.create({
      title,
      artist,
      key,
      bpm: bpm === '' ? undefined : Number(bpm),
      timeSignature,
    })
    router.push(`/editor/${song.id}`)
  }

  if (!isLoading && !session) {
    return (
      <main className="min-h-screen">
        <SiteHeader variant="app" />
        <section className="mx-auto w-full max-w-4xl px-6 py-12">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] backdrop-blur text-center">
            <h1 className="font-display text-2xl font-semibold text-slate-900">
              ログインが必要です
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              楽曲を新規作成するにはログインしてください。
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                新規登録
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <SiteHeader variant="app" />
      <section className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] backdrop-blur">
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            新しい楽曲
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            タイトルと基本情報を入力して編集を開始します。
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <label className="text-sm text-slate-600">
              曲名
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="曲名を入力"
                required
              />
            </label>

            <label className="text-sm text-slate-600">
              アーティスト
              <input
                type="text"
                value={artist}
                onChange={(event) => setArtist(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="任意"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm text-slate-600">
                キー
                <select
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  {KEYS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                BPM
                <input
                  type="number"
                  value={bpm}
                  onChange={(event) =>
                    setBpm(event.target.value === '' ? '' : Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  min={40}
                  max={240}
                />
              </label>
              <label className="text-sm text-slate-600">
                拍子
                <select
                  value={timeSignature}
                  onChange={(event) => setTimeSignature(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  {TIME_SIGNATURES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              エディタを開く
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
