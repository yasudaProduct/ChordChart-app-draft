'use client'

export const runtime = 'edge'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ArtistInput } from '@/components/song/ArtistInput'
import { songApi } from '@/lib/songApi'
import { KEY_SELECT_OPTIONS } from '@/lib/music'
import { TIME_SIGNATURES } from '@/lib/utils'
import type { SongVisibility } from '@/types/song'

const VISIBILITY_OPTIONS: { value: SongVisibility; label: string }[] = [
  { value: 'private', label: '非公開' },
  { value: 'url-only', label: 'URL共有' },
  { value: 'public', label: '公開' },
]

export default function NewSongPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  // キー・BPM・拍子は任意項目。初期状態は未設定
  const [key, setKey] = useState('')
  const [bpm, setBpm] = useState<number | ''>('')
  const [timeSignature, setTimeSignature] = useState('')
  const [visibility, setVisibility] = useState<SongVisibility>('private')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    const song = await songApi.create(
      {
        title,
        artist,
        key: key || undefined,
        bpm: bpm === '' ? undefined : Number(bpm),
        timeSignature: timeSignature || undefined,
      },
      visibility
    )
    router.push(`/editor/${song.id}`)
  }

  return (
    <main className="min-h-screen">
      <SiteHeader variant="app" />
      <section className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)] backdrop-blur">
          <h1 className="font-display text-2xl font-semibold text-slate-900">新しい楽曲</h1>
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

            <ArtistInput
              value={artist}
              onChange={setArtist}
              placeholder="任意"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              labelClassName="text-sm font-normal text-slate-600"
            />

            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm text-slate-600">
                キー
                <select
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="">未設定</option>
                  {KEY_SELECT_OPTIONS.map((item) => (
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
                  <option value="">未設定</option>
                  {TIME_SIGNATURES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <fieldset className="text-sm text-slate-600">
              <legend>公開範囲</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {VISIBILITY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 transition has-[:checked]:border-slate-400"
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={visibility === option.value}
                      onChange={() => setVisibility(option.value)}
                      className="accent-[#5c6bc0]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                公開範囲はエディタの「共有」からいつでも変更できます。
              </p>
            </fieldset>

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
