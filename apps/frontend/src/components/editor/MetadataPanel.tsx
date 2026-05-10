'use client'

import { Input } from '@/components/ui/Input'
import type { Song, SongMeta } from '@/types/song'

type MetadataPanelProps = {
  song: Song
  onChange: (field: keyof SongMeta, value: string | number | undefined) => void
}

export const MetadataPanel = ({ song, onChange }: MetadataPanelProps) => {
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
        <Input
          label="アーティスト"
          type="text"
          value={song.artist ?? ''}
          onChange={(event) => onChange('artist', (event.target as HTMLInputElement).value)}
        />
        <div>
          <Input
            label="キー"
            type="text"
            value={song.key ?? ''}
            onChange={(event) => onChange('key', (event.target as HTMLInputElement).value)}
          />
          <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            ✓ 自動検出
          </span>
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
