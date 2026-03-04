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

export const parseSectionContent = (
  content: string | undefined
): SectionContent => {
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
            // eslint-disable-next-line
            ? (line.chords as any[]).map((c) => {
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
