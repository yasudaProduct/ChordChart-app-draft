'use client'

import type { ChordBlock } from '@/lib/sectionContent'

type ChordRowProps = {
  chords: ChordBlock[]
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void
  onChordPointerDown: (event: React.PointerEvent<HTMLButtonElement>, chord: ChordBlock) => void
}

export const ChordRow = ({ chords, onClick, onChordPointerDown }: ChordRowProps) => {
  return (
    <div
      className="relative min-h-[36px] rounded-md border border-slate-200 bg-white"
      onClick={onClick}
    >
      {chords.map((chord) => (
        <button
          key={chord.id}
          type="button"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => onChordPointerDown(event, chord)}
          className="absolute rounded-md bg-indigo-500 px-2 py-1 text-xs font-semibold text-white shadow"
          style={{
            left: `${chord.offset * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {chord.chord}
        </button>
      ))}
    </div>
  )
}
