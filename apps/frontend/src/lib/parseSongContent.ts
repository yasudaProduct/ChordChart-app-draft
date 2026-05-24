import { serializeSectionContent } from '@/lib/sectionContent'
import { generateId } from '@/lib/utils'
import type { Section, SectionType } from '@/types/song'

type LegacyChord = { chord?: string; position?: number; offset?: number }
type LegacyLine = { lyrics?: string; chords?: LegacyChord[]; bars?: string[] }
type LegacySection = {
  id?: string
  name?: string
  type?: string
  content?: string
  lines?: LegacyLine[]
  bars?: Array<{ chords?: string[] }>
}

const toSectionType = (type: string | undefined, hasLyrics: boolean): SectionType => {
  if (type === 'lyrics-chord') return 'lyrics-chord'
  return hasLyrics ? 'lyrics-chord' : 'chord-only'
}

const chordsFromBarStrings = (chords: string[]) =>
  chords.map((chord, index) => ({
    id: generateId(),
    chord,
    offset: (index + 1) / (chords.length + 1),
  }))

const lineFromLegacyLine = (line: LegacyLine) => {
  if (Array.isArray(line.bars) && line.bars.length > 0) {
    return {
      id: generateId(),
      lyrics: '',
      chords: chordsFromBarStrings(line.bars),
    }
  }

  const lyrics = typeof line.lyrics === 'string' ? line.lyrics : ''
  const chords = Array.isArray(line.chords)
    ? line.chords.map((chord) => ({
        id: generateId(),
        chord: chord.chord ?? '',
        offset:
          typeof chord.offset === 'number'
            ? chord.offset
            : typeof chord.position === 'number'
              ? Math.min(chord.position / Math.max(lyrics.length, 1), 1)
              : 0,
      }))
    : []

  return { id: generateId(), lyrics, chords }
}

const normalizeLegacySection = (raw: LegacySection): Section => {
  if (typeof raw.content === 'string' && raw.name) {
    return {
      id: raw.id ?? generateId(),
      name: raw.name,
      type: raw.type === 'lyrics-chord' ? 'lyrics-chord' : 'chord-only',
      content: raw.content,
    }
  }

  const lines: LegacyLine[] = []
  if (Array.isArray(raw.lines)) {
    lines.push(...raw.lines)
  } else if (Array.isArray(raw.bars)) {
    for (const bar of raw.bars) {
      if (Array.isArray(bar.chords)) {
        lines.push({ bars: bar.chords })
      }
    }
  }

  const hasLyrics = lines.some((line) => typeof line.lyrics === 'string' && line.lyrics.length > 0)
  const sectionType = toSectionType(raw.type, hasLyrics)
  const sectionLines = lines.map((line) => lineFromLegacyLine(line))

  return {
    id: raw.id ?? generateId(),
    name: raw.name ?? 'Section',
    type: sectionType,
    content: serializeSectionContent(
      sectionLines.length > 0 ? sectionLines : [{ id: generateId(), lyrics: '', chords: [] }]
    ),
  }
}

export const parseSongContent = (value: unknown): Section[] => {
  if (value == null) return []

  let parsed: unknown = value
  if (typeof value === 'string') {
    if (value.trim() === '') return []
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  }

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return []
    return parsed.map((item) => normalizeLegacySection(item as LegacySection))
  }

  if (typeof parsed === 'object' && parsed !== null && 'sections' in parsed) {
    const sections = (parsed as { sections?: unknown }).sections
    if (!Array.isArray(sections)) return []
    return sections.map((item) => normalizeLegacySection(item as LegacySection))
  }

  return []
}

export const emptySongContent = (): string => JSON.stringify({ sections: [] })
