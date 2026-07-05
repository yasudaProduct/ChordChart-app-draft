'use client'

import { parseKeyName, transposeKeyName } from '@/lib/music'
import { cn } from '@/lib/utils'

type TransposeControlProps = {
  /** 現在の移調量（半音、-11〜+11） */
  semitones: number
  onChange: (semitones: number) => void
  /** 元のキー表記（表示用）。解釈できない場合は半音数のみ表示する */
  baseKey?: string
  className?: string
}

const clampSemitones = (value: number) => Math.max(-11, Math.min(11, value))

export const TransposeControl = ({
  semitones,
  onChange,
  baseKey,
  className,
}: TransposeControlProps) => {
  const parsedKey = parseKeyName(baseKey)
  const displayKey = parsedKey && baseKey ? transposeKeyName(baseKey, semitones) : null
  const amountLabel = semitones > 0 ? `+${semitones}` : `${semitones}`

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-700',
        className
      )}
    >
      <span className="font-semibold text-slate-500">移調</span>
      <button
        type="button"
        onClick={() => onChange(clampSemitones(semitones - 1))}
        aria-label="半音下げる"
        className="rounded-full border border-slate-200 px-2 py-0.5 font-semibold transition hover:border-slate-400"
      >
        −
      </button>
      <span className="min-w-8 text-center font-mono font-semibold">{amountLabel}</span>
      <button
        type="button"
        onClick={() => onChange(clampSemitones(semitones + 1))}
        aria-label="半音上げる"
        className="rounded-full border border-slate-200 px-2 py-0.5 font-semibold transition hover:border-slate-400"
      >
        +
      </button>
      {displayKey && (
        <span className="text-slate-500">
          Key: <span className="font-semibold text-slate-800">{displayKey}</span>
        </span>
      )}
      {semitones !== 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="text-slate-400 underline-offset-2 transition hover:text-slate-700 hover:underline"
        >
          リセット
        </button>
      )}
    </div>
  )
}
