import { useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'

export const useSectionDrag = () => {
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null)
  const { updateSong } = useEditorStore()

  const handleSectionDragStart = (event: React.DragEvent<HTMLButtonElement>, sectionId: string) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', sectionId)
    setDraggingSectionId(sectionId)
  }

  const handleSectionDragOver = (event: React.DragEvent<HTMLDivElement>, overId: string) => {
    event.preventDefault()
    if (!draggingSectionId || draggingSectionId === overId) return
    updateSong((current) => {
      const sections = [...current.sections]
      const fromIndex = sections.findIndex((section) => section.id === draggingSectionId)
      const toIndex = sections.findIndex((section) => section.id === overId)
      if (fromIndex === -1 || toIndex === -1) return current
      const [moved] = sections.splice(fromIndex, 1)
      sections.splice(toIndex, 0, moved)
      return { ...current, sections }
    })
  }

  const handleSectionDragEnd = () => {
    setDraggingSectionId(null)
  }

  return {
    draggingSectionId,
    handleSectionDragStart,
    handleSectionDragOver,
    handleSectionDragEnd,
  }
}
