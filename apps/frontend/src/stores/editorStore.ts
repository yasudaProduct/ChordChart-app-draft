import { create } from 'zustand'
import type { Section, Song, SongVisibility } from '@/types/song'
import {
  parseSectionContent,
  serializeSectionContent,
  type SectionLine,
} from '@/lib/sectionContent'

export type ChordDialogState = {
  sectionId: string
  lineId: string
  chordId?: string
  offset: number
  value: string
  position: { x: number; y: number }
}

interface EditorState {
  // データ
  song: Song | null
  // UI状態
  isPreviewVisible: boolean
  isDirty: boolean
  isSaving: boolean
  dialog: ChordDialogState | null
  shareMessage: string
  // アクション
  setSong: (song: Song) => void
  updateSong: (updater: (song: Song) => Song) => void
  /** 公開範囲のみ反映する（PATCH で保存済みのため isDirty は変更しない） */
  setSongVisibility: (visibility: SongVisibility) => void
  updateSection: (sectionId: string, updater: (section: Section) => Section) => void
  updateSectionLines: (sectionId: string, updater: (lines: SectionLine[]) => SectionLine[]) => void
  setDirty: (dirty: boolean) => void
  setSaving: (saving: boolean) => void
  setDialog: (dialog: ChordDialogState | null) => void
  setShareMessage: (message: string) => void
  togglePreview: () => void
  reset: () => void
}

const initialState = {
  song: null,
  isPreviewVisible: true,
  isDirty: false,
  isSaving: false,
  dialog: null,
  shareMessage: '',
}

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  setSong: (song) => set({ song, isDirty: false }),

  updateSong: (updater) =>
    set((state) => ({
      song: state.song ? updater(state.song) : null,
      isDirty: true,
    })),

  setSongVisibility: (visibility) =>
    set((state) => ({
      song: state.song ? { ...state.song, visibility } : null,
    })),

  updateSection: (sectionId, updater) => {
    const { updateSong } = get()
    updateSong((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? updater(section) : section
      ),
    }))
  },

  updateSectionLines: (sectionId, updater) => {
    const { updateSection } = get()
    updateSection(sectionId, (section) => {
      const { lines } = parseSectionContent(section.content)
      const nextLines = updater(lines)
      return {
        ...section,
        content: serializeSectionContent(nextLines),
      }
    })
  },

  setDirty: (dirty) => set({ isDirty: dirty }),
  setSaving: (saving) => set({ isSaving: saving }),
  setDialog: (dialog) => set({ dialog }),
  setShareMessage: (message) => set({ shareMessage: message }),
  togglePreview: () => set((state) => ({ isPreviewVisible: !state.isPreviewVisible })),
  reset: () => set(initialState),
}))
