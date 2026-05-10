'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores/editorStore'
import { useEditorActions } from '@/hooks/useEditorActions'
import { useChordDrag } from '@/hooks/useChordDrag'
import { useSectionDrag } from '@/hooks/useSectionDrag'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { MetadataPanel } from '@/components/editor/MetadataPanel'
import { SectionEditor } from '@/components/editor/SectionEditor'
import { SectionAddButtons } from '@/components/editor/SectionAddButtons'
import { Toast } from '@/components/ui/Toast'
import type { ChordBlock } from '@/lib/sectionContent'
import type { Song } from '@/types/song'

const PreviewPanel = dynamic(
  () => import('@/components/editor/PreviewPanel').then((mod) => ({ default: mod.PreviewPanel })),
  { ssr: false }
)

const ChordDialog = dynamic(
  () => import('@/components/editor/ChordDialog').then((mod) => ({ default: mod.ChordDialog })),
  { ssr: false }
)

type EditorContentProps = {
  songId: string
  fetchSong: (id: string) => Promise<Song>
  saveFn?: (id: string, song: Song) => Promise<Song>
  backHref: string
}

export const EditorContent = ({ songId, fetchSong, saveFn, backHref }: EditorContentProps) => {
  const router = useRouter()

  const song = useEditorStore((s) => s.song)
  const isPreviewVisible = useEditorStore((s) => s.isPreviewVisible)
  const isDirty = useEditorStore((s) => s.isDirty)
  const isSaving = useEditorStore((s) => s.isSaving)
  const dialog = useEditorStore((s) => s.dialog)
  const shareMessage = useEditorStore((s) => s.shareMessage)
  const setSong = useEditorStore((s) => s.setSong)
  const setDialog = useEditorStore((s) => s.setDialog)
  const togglePreview = useEditorStore((s) => s.togglePreview)

  const {
    handleMetaChange,
    handleSave,
    handleShare,
    addSection,
    duplicateSection,
    moveSection,
    deleteSection,
    addLine,
    updateLineLyrics,
    handleChordRowClick,
    handleChordConfirm,
    handleChordDelete,
  } = useEditorActions(saveFn)

  const { startChordDrag } = useChordDrag()

  const { draggingSectionId, handleSectionDragStart, handleSectionDragOver, handleSectionDragEnd } =
    useSectionDrag()

  const { isLoading: isFetching } = useSWR(`editor/${songId}`, () => fetchSong(songId), {
    onSuccess: setSong,
  })

  const isLoading = song === null && isFetching

  useEffect(() => {
    return () => {
      useEditorStore.getState().reset()
    }
  }, [songId])

  const hasSections = (song?.sections.length ?? 0) > 0

  const handleChordPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    sectionId: string,
    lineId: string,
    chord: ChordBlock
  ) => {
    event.stopPropagation()
    const rect = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!rect) return
    startChordDrag({
      sectionId,
      lineId,
      chordId: chord.id,
      rect,
      startX: event.clientX,
      moved: false,
    })
  }

  if (!song) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-6 py-16 text-sm text-slate-500">
          {isLoading ? '読み込み中...' : '楽曲が見つかりませんでした。'}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-slate-800">
      <EditorHeader
        isDirty={isDirty}
        isSaving={isSaving}
        isPreview={isPreviewVisible}
        onSave={handleSave}
        onShare={handleShare}
        onPrint={() => window.print()}
        onTogglePreview={togglePreview}
        onBack={() => router.push(backHref)}
      />

      <div className={cn('flex min-h-screen pt-16', isPreviewVisible && 'bg-white')}>
        <div
          className={cn(
            'flex-1 px-6 py-8 transition',
            isPreviewVisible ? 'w-1/2 max-w-none pr-4' : 'mx-auto max-w-[820px]'
          )}
        >
          <MetadataPanel song={song} onChange={handleMetaChange} />

          <div className="mt-6 space-y-4">
            {song.sections.map((section, index) => (
              <SectionEditor
                key={section.id}
                section={section}
                index={index}
                totalSections={song.sections.length}
                isDragging={draggingSectionId === section.id}
                onNameChange={(name) =>
                  useEditorStore.getState().updateSection(section.id, (s) => ({ ...s, name }))
                }
                onTypeChange={(type) =>
                  useEditorStore.getState().updateSection(section.id, (s) => ({ ...s, type }))
                }
                onDuplicate={() => duplicateSection(section.id)}
                onMove={(direction) => moveSection(section.id, direction)}
                onDelete={() => deleteSection(section.id)}
                onAddLine={() => addLine(section.id)}
                onChordRowClick={(event, lineId) => handleChordRowClick(event, section.id, lineId)}
                onChordPointerDown={(event, lineId, chord) =>
                  handleChordPointerDown(event, section.id, lineId, chord)
                }
                onLineLyricsChange={(lineId, lyrics) =>
                  updateLineLyrics(section.id, lineId, lyrics)
                }
                onDragStart={(event) => handleSectionDragStart(event, section.id)}
                onDragOver={(event) => handleSectionDragOver(event, section.id)}
                onDragEnd={handleSectionDragEnd}
              />
            ))}

            <SectionAddButtons onAddSection={addSection} hasSections={hasSections} />
          </div>
        </div>

        {isPreviewVisible && <PreviewPanel song={song} />}
      </div>

      {dialog && (
        <ChordDialog
          state={dialog}
          onValueChange={(value) => setDialog({ ...dialog, value })}
          onConfirm={handleChordConfirm}
          onDelete={handleChordDelete}
          onClose={() => setDialog(null)}
        />
      )}

      <Toast message={shareMessage} visible={!!shareMessage} />
    </main>
  )
}
