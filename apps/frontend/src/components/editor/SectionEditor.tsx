'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { parseSectionContent, type ChordBlock } from '@/lib/sectionContent'
import type { MusicMeta, Section, SectionType } from '@/types/song'
import { SectionHeader } from './SectionHeader'
import { SectionMetaPanel } from './SectionMetaPanel'
import { LineEditor } from './LineEditor'

type SectionEditorProps = {
  section: Section
  index: number
  totalSections: number
  isDragging: boolean
  /** キー・BPM・拍子を未設定にした場合に継承される値 */
  inheritedMeta: MusicMeta
  onNameChange: (name: string) => void
  onTypeChange: (type: SectionType) => void
  onMetaChange: (field: keyof MusicMeta, value: string | number | undefined) => void
  onDuplicate: () => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
  onAddLine: () => void
  onChordRowClick: (event: React.MouseEvent<HTMLDivElement>, lineId: string) => void
  onChordPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    lineId: string,
    chord: ChordBlock
  ) => void
  onLineLyricsChange: (lineId: string, lyrics: string) => void
  onDragStart: (event: React.DragEvent<HTMLButtonElement>) => void
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
}

export const SectionEditor = ({
  section,
  index,
  totalSections,
  isDragging,
  inheritedMeta,
  onNameChange,
  onTypeChange,
  onMetaChange,
  onDuplicate,
  onMove,
  onDelete,
  onAddLine,
  onChordRowClick,
  onChordPointerDown,
  onLineLyricsChange,
  onDragStart,
  onDragOver,
  onDragEnd,
}: SectionEditorProps) => {
  const content = parseSectionContent(section.content)
  // 一時的なビュー状態なのでローカルに持つ。リストの key={section.id} により
  // 並べ替えでは保持され、削除時に破棄される
  const [isMetaOpen, setMetaOpen] = useState(false)

  return (
    <div
      className={cn('overflow-hidden rounded-2xl bg-white shadow-sm', isDragging && 'opacity-70')}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <SectionHeader
        section={section}
        index={index}
        totalSections={totalSections}
        isMetaOpen={isMetaOpen}
        onToggleMeta={() => setMetaOpen((prev) => !prev)}
        onNameChange={onNameChange}
        onTypeChange={onTypeChange}
        onDuplicate={onDuplicate}
        onMoveUp={() => onMove(-1)}
        onMoveDown={() => onMove(1)}
        onDelete={onDelete}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />

      {isMetaOpen && (
        <SectionMetaPanel meta={section} inherited={inheritedMeta} onChange={onMetaChange} />
      )}

      <div className="space-y-5 px-4 py-5">
        {content.lines.map((line) => (
          <LineEditor
            key={line.id}
            line={line}
            sectionType={section.type}
            onChordRowClick={(event) => onChordRowClick(event, line.id)}
            onChordPointerDown={(event, chord) => onChordPointerDown(event, line.id, chord)}
            onLyricsChange={(lyrics) => onLineLyricsChange(line.id, lyrics)}
          />
        ))}

        <button
          type="button"
          onClick={onAddLine}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400 transition hover:border-primary hover:bg-indigo-50 hover:text-primary"
        >
          ＋ 行を追加
        </button>
      </div>
    </div>
  )
}
