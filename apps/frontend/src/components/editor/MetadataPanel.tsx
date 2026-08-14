'use client'

import { useMemo } from 'react'
import { DetectedKeyTooltip } from '@/components/editor/DetectedKeyTooltip'
import { ArtistInput } from '@/components/song/ArtistInput'
import { Input } from '@/components/ui/Input'
import { KEY_SELECT_OPTIONS, collectChordSymbols, detectKey } from '@/lib/music'
import { TIME_SIGNATURES, cn, withCurrentOption } from '@/lib/utils'
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
  const keyOptions = withCurrentOption(KEY_SELECT_OPTIONS, currentKey)

  // 既存データの変拍子（5/4 など）が選択肢から消えないよう、一覧に無い現在値は先頭に差し込む
  const currentTimeSignature = song.timeSignature ?? ''
  const timeSignatureOptions = withCurrentOption(TIME_SIGNATURES, currentTimeSignature)

  const showDetectedKey =
    detectedKey !== null && detectedKey.key !== currentKey && detectedKey.confidence >= 0.5

  const fieldLabelClass = 'block text-xs font-medium text-slate-500'
  /** ラベル1行の高さを他列と揃える（推定キーバッジは行内に載せない） */
  const metaLabelLineClass = 'block h-4 leading-4'
  const selectClass =
    'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary'

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <input
        type="text"
        value={song.title}
        onChange={(event) => onChange('title', event.target.value)}
        className="w-full border-none text-3xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
        placeholder="曲名を入力..."
      />
      <div className="mt-5 grid items-start gap-4 md:grid-cols-4">
        <ArtistInput
          value={song.artist ?? ''}
          onChange={(value) => onChange('artist', value)}
          labelClassName={fieldLabelClass}
          labelLineClassName={metaLabelLineClass}
        />
        <label className={cn(fieldLabelClass, 'min-w-0')}>
          <span className="flex h-4 items-center gap-1.5 leading-4">
            <span className="shrink-0">キー</span>
            {showDetectedKey && (
              <DetectedKeyTooltip
                detectedKey={detectedKey.key}
                onApply={() => onChange('key', detectedKey.key)}
              />
            )}
          </span>
          <div className="mt-2">
            <select
              value={currentKey}
              onChange={(event) => onKeyChange(event.target.value)}
              className={selectClass}
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
        <Input
          label="BPM"
          labelClassName={fieldLabelClass}
          labelLineClassName={metaLabelLineClass}
          type="number"
          value={song.bpm ?? ''}
          onChange={(event) => {
            const v = (event.target as HTMLInputElement).value
            onChange('bpm', v === '' ? undefined : Number(v))
          }}
          min={40}
          max={240}
        />
        <label className={fieldLabelClass}>
          <span className={metaLabelLineClass}>拍子</span>
          <div className="mt-2">
            <select
              value={currentTimeSignature}
              onChange={(event) => onChange('timeSignature', event.target.value || undefined)}
              className={selectClass}
            >
              <option value="">未設定</option>
              {timeSignatureOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>
    </div>
  )
}
