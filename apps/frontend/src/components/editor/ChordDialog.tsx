'use client'

import { useMemo } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import {
  getDiatonicSuggestions,
  getNextChordSuggestions,
  getSubstituteSuggestions,
} from '@/lib/music'
import type { ChordDialogState } from '@/stores/editorStore'

type ChordDialogProps = {
  state: ChordDialogState
  /**
   * 適用中のキー（ダイアトニック候補・予測の基準）。
   * セクションに設定があればそれを優先した有効キーが渡る。
   */
  songKey?: string
  /** 挿入位置の直前のコード（次のコード予測の基準） */
  previousChord?: string | null
  onValueChange: (value: string) => void
  onConfirm: () => void
  onDelete: () => void
  onClose: () => void
}

type ChordGroupProps = {
  title: string
  chords: string[]
  variant: 'default' | 'next' | 'substitute'
  onSelect: (chord: string) => void
}

/** 固定ヘッダー（h-16）に重ならないための上端マージン */
const HEADER_CLEARANCE = 96

const variantStyles = {
  default: 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary',
  next: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400',
  substitute: 'border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-400',
}

const ChordGroup = ({ title, chords, variant, onSelect }: ChordGroupProps) => (
  <div>
    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{title}</p>
    <div className="mt-2 flex flex-wrap gap-2">
      {chords.map((chord) => (
        <button
          key={chord}
          type="button"
          onClick={() => onSelect(chord)}
          className={`rounded-md border px-2 py-1 text-xs ${variantStyles[variant]}`}
        >
          {chord}
        </button>
      ))}
    </div>
  </div>
)

export const ChordDialog = ({
  state,
  songKey,
  previousChord,
  onValueChange,
  onConfirm,
  onDelete,
  onClose,
}: ChordDialogProps) => {
  // キーに基づくダイアトニック候補。キー未設定時は候補を出さない
  // （キーが未確定の段階では誤った提案になりうるため）
  const candidates = useMemo(() => getDiatonicSuggestions(songKey), [songKey])

  // 直前のコードから次に続きやすいコード
  const nextChords = useMemo(
    () => getNextChordSuggestions(songKey, previousChord),
    [songKey, previousChord]
  )

  // 入力中のコードの代理コード
  const substitutes = useMemo(
    () => getSubstituteSuggestions(songKey, state.value),
    [songKey, state.value]
  )

  return (
    <Dialog position={state.position} topMargin={HEADER_CLEARANCE} onClose={onClose}>
      <input
        type="text"
        value={state.value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onConfirm()
          }
        }}
        className="w-full rounded-lg border border-primary px-3 py-2 text-center text-lg font-semibold text-slate-900 outline-none"
      />

      <div className="mt-4 space-y-4 text-xs text-slate-500">
        {candidates.length > 0 ? (
          <ChordGroup
            title={`コード候補（Key: ${songKey}）`}
            chords={candidates}
            variant="default"
            onSelect={onValueChange}
          />
        ) : (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            キーを設定するとコード候補が表示されます。
          </p>
        )}
        {nextChords.length > 0 && previousChord && (
          <ChordGroup
            title={`次のコード予測（${previousChord} の後）`}
            chords={nextChords}
            variant="next"
            onSelect={onValueChange}
          />
        )}
        {substitutes.length > 0 && (
          <ChordGroup
            title={`代理コード（${state.value.trim()}）`}
            chords={substitutes}
            variant="substitute"
            onSelect={onValueChange}
          />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onClose}>
          キャンセル
        </Button>
        <div className="flex items-center gap-2">
          {state.chordId && (
            <Button variant="danger" onClick={onDelete}>
              削除
            </Button>
          )}
          <Button variant="primary" onClick={onConfirm}>
            確定 (Enter)
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
