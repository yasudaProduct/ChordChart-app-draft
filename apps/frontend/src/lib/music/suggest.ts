import { Note } from 'tonal'
import { parseChordSymbol, transposeChordSymbol } from './chords'
import { getDiatonicTriads, getDominantSeventh, getDominantTriad, parseKeyName } from './keys'

/**
 * キーのダイアトニックコード候補（トライアド7つ + V7）。
 * キーが解釈できない場合は空配列。
 */
export const getDiatonicSuggestions = (keyName: string | null | undefined): string[] => {
  const key = parseKeyName(keyName)
  if (!key) return []
  const triads = getDiatonicTriads(key)
  const dominant = getDominantSeventh(key)
  return Array.from(new Set([...triads, dominant]))
}

/** コードのルートがキーの何度（ダイアトニックの index 0..6）かを返す。 */
const findDegree = (keyTriads: string[], chordSymbol: string): number | null => {
  const parsed = parseChordSymbol(chordSymbol)
  if (!parsed) return null
  const chroma = Note.get(parsed.root).chroma
  if (chroma === undefined) return null
  for (let i = 0; i < keyTriads.length; i++) {
    const triad = parseChordSymbol(keyTriads[i])
    if (triad && Note.get(triad.root).chroma === chroma) return i
  }
  return null
}

/** 度数 → よく続く度数（機能和声の定石）。 */
const NEXT_DEGREES_MAJOR: number[][] = [
  [3, 4, 5, 1], // I  → IV, V, vi, ii
  [4, 6, 3], // ii → V, vii°, IV
  [5, 3], // iii → vi, IV
  [4, 0, 1], // IV → V, I, ii
  [0, 5, 3], // V  → I, vi, IV
  [1, 3, 4], // vi → ii, IV, V
  [0, 5], // vii° → I, vi
]

const NEXT_DEGREES_MINOR: number[][] = [
  [3, 4, 5, 6], // i  → iv, V, VI, VII
  [4, 0], // ii° → V, i
  [5, 6], // III → VI, VII
  [4, 0, 6], // iv → V, i, VII
  [0, 5], // V  → i, VI
  [3, 1, 4], // VI → iv, ii°, V
  [0, 2], // VII → i, III
]

/**
 * 直前のコードから「次に続きやすいコード」を提案する。
 * キーまたは直前コードが解釈できない・ダイアトニック外の場合は空配列。
 */
export const getNextChordSuggestions = (
  keyName: string | null | undefined,
  previousChord: string | null | undefined
): string[] => {
  const key = parseKeyName(keyName)
  if (!key || !previousChord) return []

  const triads = getDiatonicTriads(key)
  const degree = findDegree(triads, previousChord)
  if (degree === null) return []

  const nextDegrees = key.mode === 'major' ? NEXT_DEGREES_MAJOR[degree] : NEXT_DEGREES_MINOR[degree]

  const suggestions = nextDegrees.map((d) => {
    // マイナーキーの V はハーモニックマイナー由来のメジャートライアドで提示する
    if (key.mode === 'minor' && d === 4) return getDominantTriad(key)
    return triads[d]
  })

  // V が含まれる場合は V7 も添える
  if (nextDegrees.includes(4)) suggestions.push(getDominantSeventh(key))

  return Array.from(new Set(suggestions))
}

/** 度数 → 代理になりやすい度数。 */
const SUBSTITUTE_DEGREES_MAJOR: number[][] = [
  [5, 2], // I  → vi, iii
  [3], // ii → IV
  [5], // iii → vi
  [1], // IV → ii
  [6], // V  → vii°（+ 裏コード）
  [0, 2], // vi → I, iii
  [4], // vii° → V
]

const SUBSTITUTE_DEGREES_MINOR: number[][] = [
  [5, 2], // i  → VI, III
  [3], // ii° → iv
  [0], // III → i
  [1], // iv → ii°
  [6], // V  → VII（+ 裏コード）
  [0], // VI → i
  [4], // VII → V
]

/**
 * 入力中のコードに対する代理コードを提案する。
 * ドミナント（V）にはトライトーン代理（裏コード）も含める。
 */
export const getSubstituteSuggestions = (
  keyName: string | null | undefined,
  chordSymbol: string | null | undefined
): string[] => {
  const key = parseKeyName(keyName)
  if (!key || !chordSymbol?.trim()) return []

  const triads = getDiatonicTriads(key)
  const degree = findDegree(triads, chordSymbol)
  if (degree === null) return []

  const substituteDegrees =
    key.mode === 'major' ? SUBSTITUTE_DEGREES_MAJOR[degree] : SUBSTITUTE_DEGREES_MINOR[degree]

  const suggestions = substituteDegrees.map((d) => triads[d])

  // ドミナントの裏コード（bII7）: V7 を増4度移調する（bII 表記なので常にフラット綴り）
  if (degree === 4) {
    suggestions.push(transposeChordSymbol(getDominantSeventh(key), 6, { useFlats: true }))
  }

  const normalizedInput = chordSymbol.trim()
  return Array.from(new Set(suggestions)).filter((chord) => chord !== normalizedInput)
}
