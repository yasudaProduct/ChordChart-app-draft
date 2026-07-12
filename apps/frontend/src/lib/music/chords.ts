import { Chord, Interval, Note } from 'tonal'

export type ParsedChord = {
  /** ルート音（例: 'C#'） */
  root: string
  /** コードタイプ（例: 'm7', '7sus4', ''=メジャートライアド） */
  type: string
  /** スラッシュコードのベース音（例: 'E'）。無ければ null */
  bass: string | null
}

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'dominant' | 'unknown'

/**
 * コード記号をルート・タイプ・ベース音に分解する。
 * ルートが取れない表記（'N.C.' など）は null を返す。
 */
export const parseChordSymbol = (symbol: string): ParsedChord | null => {
  const trimmed = symbol.trim()
  if (!trimmed) return null
  const [root, type, bass] = Chord.tokenize(trimmed)
  if (!root) return null
  return { root, type, bass: bass || null }
}

/** コードの性質（メジャー/マイナー/ディミニッシュ/オーギュメント/ドミナント）を判定する。 */
export const getChordQuality = (symbol: string): ChordQuality => {
  const parsed = parseChordSymbol(symbol)
  if (!parsed) return 'unknown'
  const chord = Chord.get(parsed.root + parsed.type)
  if (chord.empty) return 'unknown'
  if (chord.type === 'dominant seventh') return 'dominant'
  switch (chord.quality) {
    case 'Major':
      return 'major'
    case 'Minor':
      return 'minor'
    case 'Diminished':
      return 'diminished'
    case 'Augmented':
      return 'augmented'
    default:
      return 'unknown'
  }
}

/** 半音数を 0..11 に正規化する。 */
export const normalizeSemitones = (semitones: number): number => ((semitones % 12) + 12) % 12

/**
 * 音名を移調し、指定の臨時記号（♯/♭）系で綴り直す。
 * E#/Cb やダブルシャープは単純な異名同音（F/B 等）に正規化する。
 */
const transposeNote = (note: string, steps: number, useFlats: boolean): string => {
  const raw = Note.transpose(note, Interval.fromSemitones(steps))
  if (!raw) return note
  const simplified = Note.simplify(raw) || raw
  if (useFlats && simplified.includes('#')) return Note.enharmonic(simplified)
  if (!useFlats && simplified.includes('b')) return Note.enharmonic(simplified)
  return simplified
}

/**
 * コード記号を半音単位で移調する。
 * - パース不能な表記はそのまま返す（歌詞メモ等を壊さない）
 * - useFlats 未指定時は元のルートの臨時記号に追従する
 */
export const transposeChordSymbol = (
  symbol: string,
  semitones: number,
  options?: { useFlats?: boolean }
): string => {
  const steps = normalizeSemitones(semitones)
  if (steps === 0) return symbol

  const parsed = parseChordSymbol(symbol)
  if (!parsed) return symbol

  const useFlats = options?.useFlats ?? parsed.root.includes('b')
  const root = transposeNote(parsed.root, steps, useFlats)
  const bass = parsed.bass ? transposeNote(parsed.bass, steps, useFlats) : null

  return `${root}${parsed.type}${bass ? `/${bass}` : ''}`
}
