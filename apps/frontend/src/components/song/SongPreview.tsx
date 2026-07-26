import { useMemo } from 'react'
import { parseSectionContent } from '@/lib/sectionContent'
import { resolveSectionMetas, sectionMetaLabel } from '@/lib/sectionMeta'
import type { Song } from '@/types/song'

type SongPreviewProps = {
  song: Song
  className?: string
}

export const SongPreview = ({ song, className }: SongPreviewProps) => {
  // 楽曲レベルのキー等も継承の基準になるため、依存は song 全体にする
  const parsedSections = useMemo(() => {
    const metas = resolveSectionMetas(song)
    return song.sections.map((s, index) => ({
      ...s,
      parsed: parseSectionContent(s.content),
      // 直前のセクションから変化した項目だけを出す
      metaLabel: sectionMetaLabel(metas[index].changed),
    }))
  }, [song])

  if (song.sections.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-500 ${
          className ?? ''
        }`}
      >
        まだセクションがありません。
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {parsedSections.map((section) => {
          const content = section.parsed
          return (
            <div
              key={section.id}
              className="print-avoid-break rounded-2xl border border-slate-200 bg-white/80 p-4 print:border-slate-300 print:bg-white"
            >
              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400 print:text-slate-600">
                <span>
                  {section.name}
                  {section.metaLabel && (
                    <span className="ml-2 font-medium normal-case tracking-normal text-primary print:text-slate-700">
                      {section.metaLabel}
                    </span>
                  )}
                </span>
                <span className="shrink-0 print:hidden">
                  {section.type === 'lyrics-chord' ? 'Lyrics' : 'Chord'}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {content.lines.map((line) => (
                  <div key={line.id} className="space-y-1">
                    <div className="relative h-6">
                      {line.chords.map((chord) => (
                        <span
                          key={chord.id}
                          className="absolute rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-primary print:bg-transparent print:px-0 print:font-bold print:text-black"
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
                      <div className="text-sm text-slate-700 print:text-black">
                        {line.lyrics || '　'}
                      </div>
                    )}
                  </div>
                ))}
                {content.lines.length === 0 && (
                  <div className="text-sm text-slate-400 print:hidden">（未入力）</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
