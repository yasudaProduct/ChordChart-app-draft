'use client'

import { Input } from '@/components/ui/Input'
import { KEY_SELECT_OPTIONS } from '@/lib/music'
import { TIME_SIGNATURES, withCurrentOption } from '@/lib/utils'
import type { MusicMeta } from '@/types/song'

type SectionMetaPanelProps = {
  /** このセクションに明示設定された値（未設定は undefined） */
  meta: MusicMeta
  /** 明示設定を消した場合に適用される値（直前のセクション → 楽曲全体） */
  inherited: MusicMeta
  onChange: (field: keyof MusicMeta, value: string | number | undefined) => void
}

/** 「未設定（継承: C）」のように、空にしたら何が使われるかを見せる。 */
const unsetLabel = (inheritedValue: string | number | undefined) =>
  inheritedValue === undefined || inheritedValue === ''
    ? '未設定'
    : `未設定（継承: ${inheritedValue}）`

/**
 * セクション単位のキー・BPM・拍子を編集するパネル。
 * 未設定のままにすると直前のセクション → 楽曲全体の順に継承される（`@/lib/sectionMeta`）。
 *
 * 空文字はここで undefined に正規化する。「明示的に空」と「継承」を区別できてしまうと
 * 継承が壊れるため、空＝継承に必ず倒す。
 */
export const SectionMetaPanel = ({ meta, inherited, onChange }: SectionMetaPanelProps) => {
  const currentKey = meta.key ?? ''
  const currentTimeSignature = meta.timeSignature ?? ''

  return (
    <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:grid-cols-3">
      <label className="text-xs font-medium text-slate-500">
        キー
        <div className="mt-1.5">
          <select
            value={currentKey}
            onChange={(event) => onChange('key', event.target.value || undefined)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-primary"
          >
            <option value="">{unsetLabel(inherited.key)}</option>
            {withCurrentOption(KEY_SELECT_OPTIONS, currentKey).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </label>

      <Input
        label="BPM"
        type="number"
        value={meta.bpm ?? ''}
        placeholder={unsetLabel(inherited.bpm)}
        onChange={(event) => {
          const value = (event.target as HTMLInputElement).value
          onChange('bpm', value === '' ? undefined : Number(value))
        }}
        min={40}
        max={240}
        className="px-3 py-1.5"
      />

      <label className="text-xs font-medium text-slate-500">
        拍子
        <div className="mt-1.5">
          <select
            value={currentTimeSignature}
            onChange={(event) => onChange('timeSignature', event.target.value || undefined)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-primary"
          >
            <option value="">{unsetLabel(inherited.timeSignature)}</option>
            {withCurrentOption(TIME_SIGNATURES, currentTimeSignature).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </label>
    </div>
  )
}
