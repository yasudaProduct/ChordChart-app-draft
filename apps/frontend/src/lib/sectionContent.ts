import { generateId } from '@/lib/utils'
import type { Section, SectionType } from '@/types/song'

export type ChordBlock = {
  id: string
  chord: string
  offset: number
}

export type SectionLine = {
  id: string
  lyrics: string
  chords: ChordBlock[]
}

export type SectionContent = {
  lines: SectionLine[]
}

export const createEmptyLine = (): SectionLine => ({
  id: generateId(),
  lyrics: '',
  chords: [],
})

export const parseSectionContent = (content: string | undefined): SectionContent => {
  if (!content) return { lines: [] }
  try {
    const parsed = JSON.parse(content) as { lines?: unknown[] }
    const rawLines = Array.isArray(parsed.lines) ? parsed.lines : []
    return {
      // eslint-disable-next-line
      lines: rawLines.map((raw: any) => {
        const line = raw as Record<string, unknown>
        return {
          id: (line.id as string) ?? generateId(),
          lyrics: typeof line.lyrics === 'string' ? line.lyrics : '',
          chords: Array.isArray(line.chords)
            ? // eslint-disable-next-line
              (line.chords as any[]).map((c) => {
                const chord = c as Record<string, unknown>
                return {
                  id: (chord.id as string) ?? generateId(),
                  chord: typeof chord.chord === 'string' ? chord.chord : '',
                  offset: typeof chord.offset === 'number' ? chord.offset : 0,
                }
              })
            : [],
        }
      }),
    }
  } catch {
    return { lines: [] }
  }
}

export const serializeSectionContent = (lines: SectionLine[]): string => {
  return JSON.stringify({ lines })
}

export const createSection = (name: string, type: SectionType): Section => ({
  id: generateId(),
  name,
  type,
  content: serializeSectionContent([createEmptyLine()]),
})

export type ChordInsertTarget = {
  sectionId: string
  lineId: string
  /** 行内の挿入位置（0〜1）。この位置より左のコードを「直前」とみなす */
  offset: number
  /** 編集中の既存コード ID（直前判定から除外する） */
  chordId?: string
}

/**
 * 挿入・編集位置の「直前のコード」を探す（次のコード予測に使う）。
 * 同じ行の左側 → 同セクションの前の行 → 前のセクション、の順に遡る。
 */
export const findPreviousChord = (
  sections: Section[],
  target: ChordInsertTarget
): string | null => {
  const sectionIndex = sections.findIndex((section) => section.id === target.sectionId)
  if (sectionIndex === -1) return null

  const { lines } = parseSectionContent(sections[sectionIndex].content)
  const lineIndex = lines.findIndex((line) => line.id === target.lineId)
  if (lineIndex === -1) return null

  // 同セクション内を現在行から遡る
  for (let li = lineIndex; li >= 0; li--) {
    const chords = lines[li].chords
      .filter((chord) => chord.id !== target.chordId)
      .filter((chord) => (li === lineIndex ? chord.offset < target.offset : true))
      .sort((a, b) => a.offset - b.offset)
    const lastChord = chords[chords.length - 1]
    if (lastChord?.chord.trim()) return lastChord.chord
  }

  // 前のセクションを遡る
  for (let si = sectionIndex - 1; si >= 0; si--) {
    const { lines: prevLines } = parseSectionContent(sections[si].content)
    for (let li = prevLines.length - 1; li >= 0; li--) {
      const chords = [...prevLines[li].chords].sort((a, b) => a.offset - b.offset)
      const lastChord = chords[chords.length - 1]
      if (lastChord?.chord.trim()) return lastChord.chord
    }
  }

  return null
}
