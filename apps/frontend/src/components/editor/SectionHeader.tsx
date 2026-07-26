'use client'

import { sectionMetaLabel } from '@/lib/sectionMeta'
import { cn } from '@/lib/utils'
import type { Section, SectionType } from '@/types/song'

type SectionHeaderProps = {
  section: Section
  index: number
  totalSections: number
  /** キー・BPM・拍子の設定行を開いているか */
  isMetaOpen: boolean
  onToggleMeta: () => void
  onNameChange: (name: string) => void
  onTypeChange: (type: SectionType) => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onDragStart: (event: React.DragEvent<HTMLButtonElement>) => void
  onDragEnd: () => void
}

export const SectionHeader = ({
  section,
  index,
  totalSections,
  isMetaOpen,
  onToggleMeta,
  onNameChange,
  onTypeChange,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDragStart,
  onDragEnd,
}: SectionHeaderProps) => {
  // このセクションに明示設定された値だけをバッジにする（継承値は出さない）
  const metaLabel = sectionMetaLabel(section)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="cursor-grab text-lg text-slate-300 active:cursor-grabbing"
          aria-label="セクションをドラッグして並び替え"
        >
          ⋮⋮
        </button>
        <input
          type="text"
          value={section.name}
          onChange={(event) => onNameChange(event.target.value)}
          className="rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-slate-600 outline-none focus:border-primary"
        />
        <div className="flex rounded-md bg-slate-200 p-1 text-xs">
          {(['lyrics-chord', 'chord-only'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={cn(
                'rounded-md px-3 py-1 text-xs transition',
                section.type === type ? 'bg-white text-slate-800 shadow' : 'text-slate-600'
              )}
            >
              {type === 'lyrics-chord' ? '歌詞+コード' : 'コード'}
            </button>
          ))}
        </div>
        {/* 設定行の開閉トグルと、設定済みの値のバッジを兼ねる */}
        <button
          type="button"
          onClick={onToggleMeta}
          aria-expanded={isMetaOpen}
          aria-label="セクションのキー・BPM・拍子を設定"
          title="キー・BPM・拍子"
          className={cn(
            'rounded-md px-2 py-1 text-xs transition',
            metaLabel
              ? 'bg-indigo-50 font-medium text-primary hover:bg-indigo-100'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          )}
        >
          ♪{metaLabel && ` ${metaLabel}`}
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
          aria-label="セクションを複製"
          title="複製"
        >
          📋
        </button>
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          aria-label="セクションを上に移動"
          title="上に移動"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === totalSections - 1}
          className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          aria-label="セクションを下に移動"
          title="下に移動"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md px-2 py-1 text-red-500 hover:bg-red-50"
          aria-label="セクションを削除"
          title="削除"
        >
          🗑
        </button>
      </div>
    </div>
  )
}
