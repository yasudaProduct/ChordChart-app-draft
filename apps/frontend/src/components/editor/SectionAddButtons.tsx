'use client'

import { SECTION_PRESETS } from '@/lib/utils'
import type { SectionType } from '@/types/song'

type SectionAddButtonsProps = {
  onAddSection: (name: string, type: SectionType) => void
  hasSections: boolean
}

export const SectionAddButtons = ({ onAddSection, hasSections }: SectionAddButtonsProps) => {
  return (
    <>
      <button
        type="button"
        onClick={() => onAddSection('セクション', 'lyrics-chord')}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-transparent px-4 py-4 text-sm text-slate-400 transition hover:border-primary hover:bg-indigo-50 hover:text-primary"
      >
        <span>＋</span>
        <span>セクションを追加</span>
      </button>

      <div className="flex flex-wrap gap-2">
        {SECTION_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onAddSection(preset, 'lyrics-chord')}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-primary hover:text-primary"
          >
            {preset}追加
          </button>
        ))}
        <button
          type="button"
          onClick={() => onAddSection('コード進行', 'chord-only')}
          className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover"
        >
          コードのみ追加
        </button>
      </div>

      {!hasSections && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-500">
          セクションを追加して編集を開始してください。
        </div>
      )}
    </>
  )
}
