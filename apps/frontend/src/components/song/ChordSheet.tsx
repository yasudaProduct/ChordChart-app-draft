import { useMemo } from 'react'
import { parseSectionContent } from '@/lib/sectionContent'
import { resolveSectionMetas, sectionMetaLabel } from '@/lib/sectionMeta'
import { songMetaEntries } from '@/lib/songMeta'
import type { Song } from '@/types/song'

type ChordSheetProps = {
  song: Song
  className?: string
}

/**
 * コード譜の共通表示コンポーネント。
 * エディタのプレビュー・楽曲詳細・共有ページで同じ見た目を保証し、
 * どの画面から印刷しても同一の出力になる（デザインの基準はエディタプレビュー）。
 *
 * 曲名・アーティスト・キー等のヘッダーもここで描画するため、
 * 利用側でタイトルを重ねて表示しないこと。
 */
export const ChordSheet = ({ song, className }: ChordSheetProps) => {
  // 楽曲レベルのキー等も継承の基準になるため、依存は song 全体にする
  const parsedSections = useMemo(() => {
    const metas = resolveSectionMetas(song)
    return song.sections.map((section, index) => ({
      ...section,
      parsed: parseSectionContent(section.content),
      // 直前のセクションから変化した項目だけを出す（転調・変拍子した箇所にだけ書く譜面と同じ）
      metaLabel: sectionMetaLabel(metas[index].changed),
    }))
  }, [song])

  return (
    <div className={className}>
      <div className="border-b-2 border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-900">{song.title}</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500 print:text-slate-700">
          <span>{song.artist || 'アーティスト未設定'}</span>
          {songMetaEntries(song).map((entry) => (
            <span key={entry.id}>
              {entry.label ? `${entry.label}: ${entry.value}` : entry.value}
            </span>
          ))}
        </div>
      </div>

      {song.sections.length === 0 ? (
        <div className="mt-6 text-sm text-slate-400 print:hidden">まだセクションがありません。</div>
      ) : (
        <div className="mt-6 space-y-6">
          {parsedSections.map((section) => (
            <div key={`${section.id}-sheet`} className="print-avoid-break">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 print:text-slate-600">
                {section.name}
                {section.metaLabel && (
                  <span className="ml-2 font-medium normal-case tracking-normal text-primary print:text-slate-700">
                    {section.metaLabel}
                  </span>
                )}
              </p>
              <div className="mt-3 space-y-4">
                {section.parsed.lines.map((line) => (
                  <div key={line.id} className="space-y-1">
                    <div className="relative h-6">
                      {line.chords.map((chord) => (
                        <span
                          key={chord.id}
                          className="absolute text-sm font-semibold text-primary print:font-bold print:text-black"
                          style={{
                            left: `${chord.offset * 100}%`,
                            transform: 'translateX(-50%)',
                          }}
                        >
                          {chord.chord}
                        </span>
                      ))}
                    </div>
                    {section.type === 'lyrics-chord' && (
                      <div className="text-sm text-slate-800 print:text-black">
                        {line.lyrics || '　'}
                      </div>
                    )}
                  </div>
                ))}
                {section.parsed.lines.length === 0 && (
                  <div className="text-sm text-slate-400 print:hidden">（未入力）</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
