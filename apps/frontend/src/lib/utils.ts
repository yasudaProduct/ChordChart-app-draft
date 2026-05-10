import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Musical keys
export const KEYS = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
] as const

// Time signatures
export const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4'] as const

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
