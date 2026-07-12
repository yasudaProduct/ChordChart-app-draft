import { Key, Note } from 'tonal'
import { normalizeSemitones } from './chords'

export type KeyMode = 'major' | 'minor'

export type ParsedKey = {
  tonic: string
  mode: KeyMode
}

/** クロマ（0=C）→ 慣用的なキー表記のトニック */
const MAJOR_TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const
const MINOR_TONICS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'] as const

/** キー選択 UI 用の一覧（メジャー12 + マイナー12） */
export const KEY_SELECT_OPTIONS: string[] = [
  ...MAJOR_TONICS,
  ...MINOR_TONICS.map((tonic) => `${tonic}m`),
]

/**
 * キー表記（'C', 'F#m' など）をトニックとモードに分解する。
 * 解釈できない表記は null を返す。
 */
export const parseKeyName = (key: string | null | undefined): ParsedKey | null => {
  if (!key) return null
  const match = /^([A-Ga-g][#b]?)(m)?$/.exec(key.trim())
  if (!match) return null
  const tonic = match[1].charAt(0).toUpperCase() + (match[1].charAt(1) ?? '')
  return { tonic, mode: match[2] ? 'minor' : 'major' }
}

/** ParsedKey を表記文字列に戻す（'C' / 'F#m'）。 */
export const formatKeyName = (key: ParsedKey): string =>
  key.mode === 'minor' ? `${key.tonic}m` : key.tonic

/** キーの調号がフラット系かどうか（移調時の綴りの基準）。 */
export const keyUsesFlats = (key: ParsedKey): boolean => {
  const alteration =
    key.mode === 'major' ? Key.majorKey(key.tonic).alteration : Key.minorKey(key.tonic).alteration
  return alteration < 0
}

/** キー表記を半音単位で移調し、慣用的な表記（D# major → Eb 等）に正規化する。 */
export const transposeKeyName = (key: string, semitones: number): string => {
  const parsed = parseKeyName(key)
  if (!parsed) return key
  const steps = normalizeSemitones(semitones)
  if (steps === 0) return formatKeyName(parsed)

  const chroma = Note.get(parsed.tonic).chroma
  if (chroma === undefined) return key
  const nextChroma = (chroma + steps) % 12
  const tonics = parsed.mode === 'major' ? MAJOR_TONICS : MINOR_TONICS
  return formatKeyName({ tonic: tonics[nextChroma], mode: parsed.mode })
}

/** 2つのキー表記の間の半音差（from → to、0..11）。どちらかが解釈不能なら null。 */
export const semitonesBetweenKeys = (from: string, to: string): number | null => {
  const parsedFrom = parseKeyName(from)
  const parsedTo = parseKeyName(to)
  if (!parsedFrom || !parsedTo) return null
  const fromChroma = Note.get(parsedFrom.tonic).chroma
  const toChroma = Note.get(parsedTo.tonic).chroma
  if (fromChroma === undefined || toChroma === undefined) return null
  return normalizeSemitones(toChroma - fromChroma)
}

/** キーのダイアトニックトライアド（マイナーはナチュラル基準）。 */
export const getDiatonicTriads = (key: ParsedKey): string[] => {
  if (key.mode === 'major') return [...Key.majorKey(key.tonic).triads]
  return [...Key.minorKey(key.tonic).natural.triads]
}

/** キーのダイアトニックセブンスコード（マイナーはナチュラル基準）。 */
export const getDiatonicSevenths = (key: ParsedKey): string[] => {
  if (key.mode === 'major') return [...Key.majorKey(key.tonic).chords]
  return [...Key.minorKey(key.tonic).natural.chords]
}

/** ドミナント7th（マイナーはハーモニックマイナー由来の V7）。 */
export const getDominantSeventh = (key: ParsedKey): string => {
  if (key.mode === 'major') return Key.majorKey(key.tonic).chords[4]
  return Key.minorKey(key.tonic).harmonic.chords[4]
}

/** ハーモニックマイナー由来の V（メジャートライアド）。メジャーキーはそのまま V。 */
export const getDominantTriad = (key: ParsedKey): string => {
  if (key.mode === 'major') return Key.majorKey(key.tonic).triads[4]
  return Key.minorKey(key.tonic).harmonic.triads[4]
}
