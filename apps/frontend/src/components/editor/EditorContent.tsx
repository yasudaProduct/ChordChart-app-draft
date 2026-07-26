'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { cn } from '@/lib/utils'
import { collectChordSymbols, semitonesBetweenKeys } from '@/lib/music'
import { resolveSectionMetaById, resolveSectionMetas } from '@/lib/sectionMeta'
import { useEditorStore } from '@/stores/editorStore'
import { useEditorActions } from '@/hooks/useEditorActions'
import { useChordDrag } from '@/hooks/useChordDrag'
import { useSectionDrag } from '@/hooks/useSectionDrag'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { KeyChangeDialog } from '@/components/editor/KeyChangeDialog'
import { MetadataPanel } from '@/components/editor/MetadataPanel'
import { SectionEditor } from '@/components/editor/SectionEditor'
import { SectionAddButtons } from '@/components/editor/SectionAddButtons'
import { SharePanel } from '@/components/editor/SharePanel'
import { Toast } from '@/components/ui/Toast'
import { findPreviousChord, type ChordBlock } from '@/lib/sectionContent'
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
  /** 共有機能の有効/無効（デモモードではサーバー保存が無いため無効化する） */
  shareEnabled?: boolean
  /** 所有者以外のアクセスを拒否するか。*/
  requireOwnership?: boolean
}

export const EditorContent = ({
  songId,
  fetchSong,
  saveFn,
  backHref,
  shareEnabled = true,
  requireOwnership = false,
}: EditorContentProps) => {
  const router = useRouter()
  const [isShareOpen, setShareOpen] = useState(false)
  const [pendingKeyChange, setPendingKeyChange] = useState<{
    from: string
    to: string
    semitones: number
  } | null>(null)

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
    applyTranspose,
    handleSave,
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

  // キー変更: 既存コードがあり移調距離が確定できる場合は「コードも移調するか」を確認する
  const handleKeyChange = useCallback(
    (nextKey: string) => {
      const current = useEditorStore.getState().song
      if (!current) return
      const currentKey = current.key ?? ''
      if (nextKey === currentKey) return

      const semitones = currentKey && nextKey ? semitonesBetweenKeys(currentKey, nextKey) : null
      const hasChords = collectChordSymbols(current).length > 0

      if (semitones !== null && semitones !== 0 && hasChords) {
        setPendingKeyChange({ from: currentKey, to: nextKey, semitones })
      } else {
        handleMetaChange('key', nextKey)
      }
    },
    [handleMetaChange]
  )

  // セクションごとのキー・BPM・拍子の解決結果（未設定は直前セクション → 楽曲全体を継承）
  const sectionMetas = useMemo(() => (song ? resolveSectionMetas(song) : []), [song])

  // コード候補は編集中セクションの有効キーで算出する（転調セクションでも正しい候補が出る）
  const dialogKey = useMemo(() => {
    if (!dialog || !song) return song?.key
    return resolveSectionMetaById(song, dialog.sectionId)?.effective.key ?? song.key
  }, [dialog, song])

  // 挿入・編集位置の直前のコード（次のコード予測に使う）
  const previousChord = useMemo(() => {
    if (!dialog || !song) return null
    return findPreviousChord(song.sections, {
      sectionId: dialog.sectionId,
      lineId: dialog.lineId,
      offset: dialog.offset,
      chordId: dialog.chordId,
    })
  }, [dialog, song])

  const { startChordDrag } = useChordDrag()

  const { draggingSectionId, handleSectionDragStart, handleSectionDragOver, handleSectionDragEnd } =
    useSectionDrag()

  const { isLoading: isFetching } = useSWR(`editor/${songId}`, () => fetchSong(songId), {
    onSuccess: setSong,
  })

  const isLoading = song === null && isFetching
  const isForbidden = requireOwnership && song !== null && song?.isOwner === false

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

  if (!song || isForbidden) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center text-sm text-slate-500">
          {isLoading ? (
            '読み込み中...'
          ) : isForbidden ? (
            <>
              <p>この楽曲を編集する権限がありません。</p>
              <button
                type="button"
                onClick={() => router.push(backHref)}
                className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
              >
                一覧へ戻る
              </button>
            </>
          ) : (
            '楽曲が見つかりませんでした。'
          )}
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
        onShare={shareEnabled ? () => setShareOpen(true) : undefined}
        onPrint={() => {
          // 印刷対象はプレビュー。非表示なら表示してから印刷する
          if (!useEditorStore.getState().isPreviewVisible) {
            togglePreview()
            setTimeout(() => window.print(), 100)
            return
          }
          window.print()
        }}
        onTogglePreview={togglePreview}
        onBack={() => router.push(backHref)}
      />

      <div className={cn('flex min-h-screen pt-16 print:pt-0', isPreviewVisible && 'bg-white')}>
        <div
          className={cn(
            'flex-1 px-6 py-8 transition print:hidden',
            isPreviewVisible ? 'w-1/2 max-w-none pr-4' : 'mx-auto max-w-[820px]'
          )}
        >
          <MetadataPanel song={song} onChange={handleMetaChange} onKeyChange={handleKeyChange} />

          <div className="mt-6 space-y-4">
            {song.sections.map((section, index) => (
              <SectionEditor
                key={section.id}
                section={section}
                index={index}
                totalSections={song.sections.length}
                isDragging={draggingSectionId === section.id}
                inheritedMeta={sectionMetas[index]?.inherited ?? {}}
                onNameChange={(name) =>
                  useEditorStore.getState().updateSection(section.id, (s) => ({ ...s, name }))
                }
                onTypeChange={(type) =>
                  useEditorStore.getState().updateSection(section.id, (s) => ({ ...s, type }))
                }
                onMetaChange={(field, value) =>
                  useEditorStore
                    .getState()
                    .updateSection(section.id, (s) => ({ ...s, [field]: value }))
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
          songKey={dialogKey}
          previousChord={previousChord}
          onValueChange={(value) => setDialog({ ...dialog, value })}
          onConfirm={handleChordConfirm}
          onDelete={handleChordDelete}
          onClose={() => setDialog(null)}
        />
      )}

      {pendingKeyChange && (
        <KeyChangeDialog
          fromKey={pendingKeyChange.from}
          toKey={pendingKeyChange.to}
          onTranspose={() => {
            applyTranspose(pendingKeyChange.semitones, pendingKeyChange.to)
            setPendingKeyChange(null)
          }}
          onKeyOnly={() => {
            handleMetaChange('key', pendingKeyChange.to)
            setPendingKeyChange(null)
          }}
          onCancel={() => setPendingKeyChange(null)}
        />
      )}

      {isShareOpen && <SharePanel song={song} onClose={() => setShareOpen(false)} />}

      <Toast message={shareMessage} visible={!!shareMessage} />
    </main>
  )
}
