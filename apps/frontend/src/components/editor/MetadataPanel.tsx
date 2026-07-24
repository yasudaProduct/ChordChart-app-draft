'use client'

import { useMemo } from 'react'
import { ArtistInput } from '@/components/song/ArtistInput'
import { Input } from '@/components/ui/Input'
import { KEY_SELECT_OPTIONS, collectChordSymbols, detectKey } from '@/lib/music'
import type { Song, SongMeta } from '@/types/song'

type MetadataPanelProps = {
  song: Song
  onChange: (field: keyof SongMeta, value: string | number | undefined) => void
  /** キー選択時の変更（移調確認を挟むため onChange とは別経路） */
  onKeyChange: (key: string) => void
}

export const MetadataPanel = ({ song, onChange, onKeyChange }: MetadataPanelProps) => {
  // コード進行からのキー推定（G7: キー自動検出）
  const detectedKey = useMemo(() => {
    const symbols = collectChordSymbols(song)
    if (symbols.length < 2) return null
    return detectKey(symbols)
  }, [song])

  const currentKey = song.key ?? ''
  const keyOptions = KEY_SELECT_OPTIONS.includes(currentKey)
    ? KEY_SELECT_OPTIONS
    : currentKey
      ? [currentKey, ...KEY_SELECT_OPTIONS]
      : KEY_SELECT_OPTIONS

  const showDetectedKey =
    detectedKey !== null && detectedKey.key !== currentKey && detectedKey.confidence >= 0.5

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <input
        type="text"
        value={song.title}
        onChange={(event) => onChange('title', event.target.value)}
        className="w-full border-none text-3xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
        placeholder="曲名を入力..."
      />
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <ArtistInput value={song.artist ?? ''} onChange={(value) => onChange('artist', value)} />
        <div>
          <label className="text-xs font-medium text-slate-500">
            キー
            <div className="mt-2">
              <select
                value={currentKey}
                onChange={(event) => onKeyChange(event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
              >
                <option value="">未設定</option>
                {keyOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </label>
          {showDetectedKey && (
            <button
              type="button"
              onClick={() => onChange('key', detectedKey.key)}
              className="mt-1.5 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 transition hover:bg-emerald-100"
              title="コード進行からの推定キーを適用します（コードは移調しません）"
            >
              推定キー: {detectedKey.key} — 適用
            </button>
          )}
        </div>
        <Input
          label="BPM"
          type="number"
          value={song.bpm ?? ''}
          onChange={(event) => {
            const v = (event.target as HTMLInputElement).value
            onChange('bpm', v === '' ? undefined : Number(v))
          }}
          min={40}
          max={240}
        />
        <Input
          label="拍子"
          type="text"
          value={song.timeSignature}
          onChange={(event) => onChange('timeSignature', (event.target as HTMLInputElement).value)}
        />
      </div>
    </div>
  )
}
