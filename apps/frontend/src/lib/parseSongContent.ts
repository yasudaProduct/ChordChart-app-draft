import { serializeSectionContent } from '@/lib/sectionContent'
import { generateId } from '@/lib/utils'
import type { MusicMeta, Section, SectionType } from '@/types/song'

type LegacyChord = { chord?: string; position?: number; offset?: number }
type LegacyLine = { lyrics?: string; chords?: LegacyChord[]; bars?: string[] }
type LegacySection = {
  id?: string
  name?: string
  type?: string
  content?: string
  lines?: LegacyLine[]
  bars?: Array<{ chords?: string[] }>
  // セクション単位のキー・BPM・拍子。外部由来の JSON なので型を信用せず unknown で受ける
  key?: unknown
  bpm?: unknown
  timeSignature?: unknown
}

/**
 * キー表記のサニタイズ。空文字・空白のみは「未設定」として落とす。
 * 表記の妥当性（'Hm' 等）は検証しない — 楽曲レベルのキーも未検証で、
 * 下流の `parseKeyName` が解釈不能な値を安全に素通しするため。
 */
const sanitizeMetaKey = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined

/**
 * BPM のサニタイズ。数値文字列 '120' も受ける。
 * 非数値・範囲外は落とし、継承（直前セクション → 楽曲全体）にフォールバックさせる。
 * クランプせず落とすのは、無言でデータを書き換えないため。
 */
const sanitizeBpm = (value: unknown): number | undefined => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(parsed)) return undefined
  const rounded = Math.round(parsed)
  return rounded >= 1 && rounded <= 999 ? rounded : undefined
}

/**
 * 拍子のサニタイズ。'5/4' などの変拍子も保持したいので選択肢との照合はしない
 * （DB のカラム長 varchar(10) に合わせて長さだけ制限する）。
 */
const sanitizeTimeSignature = (value: unknown): string | undefined => {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed !== '' && trimmed.length <= 10 ? trimmed : undefined
}

/** セクション JSON からキー・BPM・拍子を取り出す（未設定・不正値は undefined）。 */
const sectionMetaFromRaw = (raw: LegacySection): MusicMeta => ({
  key: sanitizeMetaKey(raw.key),
  bpm: sanitizeBpm(raw.bpm),
  timeSignature: sanitizeTimeSignature(raw.timeSignature),
})

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
  // 現行形式・レガシー形式のどちらの分岐でもメタが落ちないよう、先に取り出しておく
  const meta = sectionMetaFromRaw(raw)

  if (typeof raw.content === 'string' && raw.name) {
    return {
      ...meta,
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
    ...meta,
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
