'use client'

import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import type { ChordDialogState } from '@/stores/editorStore'

const CHORD_LIBRARY = ['A', 'Am', 'A7', 'Am7', 'Amaj7', 'Asus4', 'Aadd9']
const NEXT_CHORDS = ['G', 'C', 'Am', 'Dm']
const SUBSTITUTE_CHORDS = ['Am7', 'Fmaj7', 'Dm7']

type ChordDialogProps = {
  state: ChordDialogState
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

const variantStyles = {
  default: 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary',
  next: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  substitute: 'border-orange-200 bg-orange-50 text-orange-700',
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
  onValueChange,
  onConfirm,
  onDelete,
  onClose,
}: ChordDialogProps) => {
  return (
    <Dialog position={state.position} onClose={onClose}>
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
        <ChordGroup
          title="コード候補"
          chords={CHORD_LIBRARY}
          variant="default"
          onSelect={onValueChange}
        />
        <ChordGroup
          title="次のコード予測"
          chords={NEXT_CHORDS}
          variant="next"
          onSelect={onValueChange}
        />
        <ChordGroup
          title="代理コード"
          chords={SUBSTITUTE_CHORDS}
          variant="substitute"
          onSelect={onValueChange}
        />
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
