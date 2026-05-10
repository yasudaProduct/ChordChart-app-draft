'use client'

import { ChordRow } from './ChordRow'
import type { ChordBlock, SectionLine } from '@/lib/sectionContent'
import type { SectionType } from '@/types/song'

type LineEditorProps = {
  line: SectionLine
  sectionType: SectionType
  onChordRowClick: (event: React.MouseEvent<HTMLDivElement>) => void
  onChordPointerDown: (event: React.PointerEvent<HTMLButtonElement>, chord: ChordBlock) => void
  onLyricsChange: (lyrics: string) => void
}

export const LineEditor = ({
  line,
  sectionType,
  onChordRowClick,
  onChordPointerDown,
  onLyricsChange,
}: LineEditorProps) => {
  return (
    <div className="space-y-2">
      <ChordRow
        chords={line.chords}
        onClick={onChordRowClick}
        onChordPointerDown={onChordPointerDown}
      />
      {sectionType === 'lyrics-chord' && (
        <input
          type="text"
          value={line.lyrics}
          onChange={(event) => onLyricsChange(event.target.value)}
          placeholder="歌詞を入力...（上のエリアをクリックでコード配置）"
          className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
        />
      )}
    </div>
  )
}
