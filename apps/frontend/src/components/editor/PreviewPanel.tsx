'use client'

import { ChordSheet } from '@/components/song/ChordSheet'
import type { Song } from '@/types/song'

type PreviewPanelProps = {
  song: Song
}

/**
 * エディタ右側のライブプレビュー兼、エディタからの印刷対象。
 * 譜面の描画は詳細・共有ページと共通の ChordSheet に集約している。
 */
export const PreviewPanel = ({ song }: PreviewPanelProps) => (
  <aside className="w-1/2 border-l border-slate-200 bg-white px-8 py-10 print:w-full print:border-none print:px-0 print:py-0">
    <ChordSheet song={song} />
  </aside>
)
