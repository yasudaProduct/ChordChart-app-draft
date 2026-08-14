import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// キーの一覧は @/lib/music の KEY_SELECT_OPTIONS を使用する

// Time signatures
export const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4'] as const

/**
 * 選択肢に無い現在値を先頭に差し込んだ一覧を返す。
 * 既存データの変拍子（5/4 など）や見慣れないキーが、選択肢に無いという理由で
 * 消えてしまわないようにするためのもの。
 */
export function withCurrentOption(options: readonly string[], current: string): string[] {
  if (!current || options.includes(current)) return [...options]
  return [current, ...options]
}

// Common section names
export const SECTION_PRESETS = [
  'イントロ',
  'Aメロ',
  'Bメロ',
  'サビ',
  '間奏',
  'Cメロ',
  'アウトロ',
] as const
