import { Key, Note } from 'tonal'
import { getChordQuality, parseChordSymbol, type ChordQuality } from './chords'
import { formatKeyName, type KeyMode, type ParsedKey } from './keys'

export type KeyDetectionResult = {
  /** 推定キー表記（'G' / 'Am' など） */
  key: string
  /** 0..1 の確からしさ */
  confidence: number
}

type NormalizedChord = {
  chroma: number
  quality: ChordQuality
}

type KeyCandidate = {
  key: ParsedKey
  tonicChroma: number
  /** ダイアトニックコード（マイナーはナチュラル+ハーモニック） */
  diatonic: NormalizedChord[]
  scaleChromas: Set<number>
}

const MAJOR_TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const MINOR_TONICS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

const normalizeChord = (symbol: string): NormalizedChord | null => {
  const parsed = parseChordSymbol(symbol)
  if (!parsed) return null
  const chroma = Note.get(parsed.root).chroma
  if (chroma === undefined) return null
  return { chroma, quality: getChordQuality(symbol) }
}

const normalizeTriads = (triads: string[]): NormalizedChord[] =>
  triads.map(normalizeChord).filter((chord): chord is NormalizedChord => chord !== null)

const buildCandidate = (tonic: string, mode: KeyMode): KeyCandidate | null => {
  const tonicChroma = Note.get(tonic).chroma
  if (tonicChroma === undefined) return null

  const triads =
    mode === 'major'
      ? Key.majorKey(tonic).triads
      : // マイナーはナチュラル + ハーモニック（V がメジャーになる）を許容
        [...Key.minorKey(tonic).natural.triads, ...Key.minorKey(tonic).harmonic.triads]

  const diatonic = normalizeTriads([...triads])
  return {
    key: { tonic, mode },
    tonicChroma,
    diatonic,
    scaleChromas: new Set(diatonic.map((chord) => chord.chroma)),
  }
}

const CANDIDATES: KeyCandidate[] = [
  ...MAJOR_TONICS.map((tonic) => buildCandidate(tonic, 'major')),
  ...MINOR_TONICS.map((tonic) => buildCandidate(tonic, 'minor')),
].filter((candidate): candidate is KeyCandidate => candidate !== null)

/** トライアド照合では dominant はメジャー、それ以外の不明品質は chroma のみで比較する。 */
const matchesDiatonic = (chord: NormalizedChord, diatonic: NormalizedChord[]): boolean => {
  const quality = chord.quality === 'dominant' ? 'major' : chord.quality
  return diatonic.some(
    (entry) => entry.chroma === chord.chroma && (quality === 'unknown' || entry.quality === quality)
  )
}

/**
 * コード進行からキーを推定する。
 * ダイアトニック一致度と、最初・最後のコード（トニックになりやすい）で採点する。
 */
export const detectKey = (chordSymbols: string[]): KeyDetectionResult | null => {
  const normalized = chordSymbols
    .map(normalizeChord)
    .filter((chord): chord is NormalizedChord => chord !== null)

  if (normalized.length === 0) return null

  const first = normalized[0]
  const last = normalized[normalized.length - 1]

  let best: { candidate: KeyCandidate; score: number } | null = null

  for (const candidate of CANDIDATES) {
    let score = 0
    for (const chord of normalized) {
      if (matchesDiatonic(chord, candidate.diatonic)) {
        score += 2
      } else if (candidate.scaleChromas.has(chord.chroma)) {
        score += 1
      }
    }
    if (first.chroma === candidate.tonicChroma) score += 2
    if (last.chroma === candidate.tonicChroma) score += 3

    if (!best || score > best.score) {
      best = { candidate, score }
    }
  }

  if (!best || best.score === 0) return null

  const maxScore = normalized.length * 2 + 5
  return {
    key: formatKeyName(best.candidate.key),
    confidence: Math.min(1, best.score / maxScore),
  }
}
