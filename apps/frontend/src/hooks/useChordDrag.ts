import { useCallback, useEffect, useRef } from 'react'
import { useEditorActions } from './useEditorActions'

type DragChordState = {
  sectionId: string
  lineId: string
  chordId: string
  rect: DOMRect
  startX: number
  moved: boolean
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export const useChordDrag = () => {
  const dragRef = useRef<DragChordState | null>(null)
  const actionsRef = useRef<ReturnType<typeof useEditorActions>>(null!)
  actionsRef.current = useEditorActions()

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const offset = clamp((event.clientX - drag.rect.left) / drag.rect.width)
      actionsRef.current.updateChordOffset(drag.sectionId, drag.lineId, drag.chordId, offset)
      drag.moved = drag.moved || Math.abs(event.clientX - drag.startX) > 3
    }

    const handleUp = () => {
      const drag = dragRef.current
      if (!drag) return
      if (!drag.moved) {
        const targetLine = actionsRef.current.findLine(drag.sectionId, drag.lineId)
        const chord = targetLine?.chords.find((item) => item.id === drag.chordId)
        if (chord) {
          actionsRef.current.openDialog({
            sectionId: drag.sectionId,
            lineId: drag.lineId,
            chordId: chord.id,
            offset: chord.offset,
            value: chord.chord,
            position: {
              x: drag.rect.left + drag.rect.width * chord.offset,
              y: drag.rect.top,
            },
          })
        }
      }
      dragRef.current = null
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [])

  const startChordDrag = useCallback((state: DragChordState) => {
    dragRef.current = state
  }, [])

  return { startChordDrag }
}
