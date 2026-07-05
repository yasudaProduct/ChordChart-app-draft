import { useCallback } from 'react'
import { useEditorStore, type ChordDialogState } from '@/stores/editorStore'
import { songApi } from '@/lib/songApi'
import { transposeSong } from '@/lib/music'
import {
  createEmptyLine,
  createSection,
  parseSectionContent,
  serializeSectionContent,
  type ChordBlock,
  type SectionLine,
} from '@/lib/sectionContent'
import { generateId } from '@/lib/utils'
import type { Section, SectionType, Song } from '@/types/song'

type SaveFn = (id: string, song: Song) => Promise<Song>

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

const cloneSectionContent = (content: string) => {
  const parsed = parseSectionContent(content)
  const clonedLines: SectionLine[] = parsed.lines.map((line) => ({
    id: generateId(),
    lyrics: line.lyrics,
    chords: line.chords.map((chord) => ({
      id: generateId(),
      chord: chord.chord,
      offset: chord.offset,
    })),
  }))
  return serializeSectionContent(clonedLines)
}

export const useEditorActions = (saveFn?: SaveFn) => {
  const { song, updateSong, updateSectionLines, setSong, setDirty, setSaving, setDialog, dialog } =
    useEditorStore()

  const handleMetaChange = useCallback(
    (field: keyof Song, value: string | number | undefined) => {
      updateSong((prev) => ({ ...prev, [field]: value }))
    },
    [updateSong]
  )

  /** 全セクションのコードを移調してキーを変更する（G5: 移調）。 */
  const applyTranspose = useCallback(
    (semitones: number, targetKey: string) => {
      updateSong((prev) => ({ ...transposeSong(prev, semitones), key: targetKey }))
    },
    [updateSong]
  )

  const handleSave = useCallback(async () => {
    if (!song) return
    setSaving(true)
    try {
      const save = saveFn ?? ((id: string, s: Song) => songApi.update(id, s))
      const updated = await save(song.id, song)
      setSong(updated)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }, [song, setSaving, setSong, setDirty, saveFn])

  const addSection = useCallback(
    (name: string, type: SectionType) => {
      updateSong((prev) => ({
        ...prev,
        sections: [...prev.sections, createSection(name, type)],
      }))
    },
    [updateSong]
  )

  const duplicateSection = useCallback(
    (sectionId: string) => {
      updateSong((current) => {
        const index = current.sections.findIndex((section) => section.id === sectionId)
        if (index === -1) return current
        const source = current.sections[index]
        const duplicated: Section = {
          ...source,
          id: generateId(),
          name: `${source.name} コピー`,
          content: cloneSectionContent(source.content),
        }
        const next = [...current.sections]
        next.splice(index + 1, 0, duplicated)
        return { ...current, sections: next }
      })
    },
    [updateSong]
  )

  const moveSection = useCallback(
    (sectionId: string, direction: -1 | 1) => {
      updateSong((current) => {
        const index = current.sections.findIndex((section) => section.id === sectionId)
        const target = index + direction
        if (index === -1 || target < 0 || target >= current.sections.length) return current
        const next = [...current.sections]
        const [removed] = next.splice(index, 1)
        next.splice(target, 0, removed)
        return { ...current, sections: next }
      })
    },
    [updateSong]
  )

  const deleteSection = useCallback(
    (sectionId: string) => {
      updateSong((current) => ({
        ...current,
        sections: current.sections.filter((section) => section.id !== sectionId),
      }))
    },
    [updateSong]
  )

  const addLine = useCallback(
    (sectionId: string) => {
      updateSectionLines(sectionId, (lines) => [...lines, createEmptyLine()])
    },
    [updateSectionLines]
  )

  const updateLineLyrics = useCallback(
    (sectionId: string, lineId: string, lyrics: string) => {
      updateSectionLines(sectionId, (lines) =>
        lines.map((line) => (line.id === lineId ? { ...line, lyrics } : line))
      )
    },
    [updateSectionLines]
  )

  const addChord = useCallback(
    (sectionId: string, lineId: string, chord: string, offset: number) => {
      updateSectionLines(sectionId, (lines) =>
        lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                chords: [...line.chords, { id: generateId(), chord, offset }].sort(
                  (a, b) => a.offset - b.offset
                ),
              }
            : line
        )
      )
    },
    [updateSectionLines]
  )

  const updateChord = useCallback(
    (sectionId: string, lineId: string, chordId: string, chord: string) => {
      updateSectionLines(sectionId, (lines) =>
        lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                chords: line.chords.map((item) =>
                  item.id === chordId ? { ...item, chord } : item
                ),
              }
            : line
        )
      )
    },
    [updateSectionLines]
  )

  const updateChordOffset = useCallback(
    (sectionId: string, lineId: string, chordId: string, offset: number) => {
      updateSectionLines(sectionId, (lines) =>
        lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                chords: line.chords.map((chord) =>
                  chord.id === chordId ? { ...chord, offset } : chord
                ),
              }
            : line
        )
      )
    },
    [updateSectionLines]
  )

  const deleteChord = useCallback(
    (sectionId: string, lineId: string, chordId: string) => {
      updateSectionLines(sectionId, (lines) =>
        lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                chords: line.chords.filter((item) => item.id !== chordId),
              }
            : line
        )
      )
    },
    [updateSectionLines]
  )

  const findLine = useCallback(
    (sectionId: string, lineId: string) => {
      const section = song?.sections.find((item) => item.id === sectionId)
      if (!section) return null
      const { lines } = parseSectionContent(section.content)
      return lines.find((line) => line.id === lineId) ?? null
    },
    [song]
  )

  const openDialog = useCallback(
    (next: ChordDialogState) => {
      if (typeof window !== 'undefined') {
        const width = 320
        const height = 260
        const x = Math.min(
          window.innerWidth - width - 16,
          Math.max(16, next.position.x - width / 2)
        )
        const y = Math.min(window.innerHeight - height - 16, Math.max(96, next.position.y + 16))
        setDialog({ ...next, position: { x, y } })
        return
      }
      setDialog(next)
    },
    [setDialog]
  )

  const handleChordRowClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, sectionId: string, lineId: string) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const offset = clamp((event.clientX - rect.left) / rect.width)
      openDialog({
        sectionId,
        lineId,
        offset,
        value: '',
        position: { x: event.clientX, y: rect.top },
      })
    },
    [openDialog]
  )

  const handleChordConfirm = useCallback(() => {
    if (!dialog) return
    if (!dialog.value.trim()) {
      setDialog(null)
      return
    }
    if (dialog.chordId) {
      updateChord(dialog.sectionId, dialog.lineId, dialog.chordId, dialog.value.trim())
    } else {
      addChord(dialog.sectionId, dialog.lineId, dialog.value.trim(), dialog.offset)
    }
    setDialog(null)
  }, [dialog, setDialog, updateChord, addChord])

  const handleChordDelete = useCallback(() => {
    if (!dialog || !dialog.chordId) return
    deleteChord(dialog.sectionId, dialog.lineId, dialog.chordId)
    setDialog(null)
  }, [dialog, setDialog, deleteChord])

  const handleChordBlockPointerDown = useCallback(
    (
      event: React.PointerEvent<HTMLButtonElement>,
      sectionId: string,
      lineId: string,
      chord: ChordBlock
    ) => {
      event.stopPropagation()
      const rect = event.currentTarget.parentElement?.getBoundingClientRect()
      if (!rect) return
      return {
        sectionId,
        lineId,
        chordId: chord.id,
        rect,
        startX: event.clientX,
        moved: false,
      }
    },
    []
  )

  return {
    handleMetaChange,
    applyTranspose,
    handleSave,
    addSection,
    duplicateSection,
    moveSection,
    deleteSection,
    addLine,
    updateLineLyrics,
    addChord,
    updateChord,
    updateChordOffset,
    deleteChord,
    findLine,
    openDialog,
    handleChordRowClick,
    handleChordConfirm,
    handleChordDelete,
    handleChordBlockPointerDown,
  }
}
