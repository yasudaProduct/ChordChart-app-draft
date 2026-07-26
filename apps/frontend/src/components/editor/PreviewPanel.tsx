'use client'

import { useMemo } from 'react'
import { parseSectionContent } from '@/lib/sectionContent'
import { songMetaEntries } from '@/lib/songMeta'
import type { Song } from '@/types/song'

type PreviewPanelProps = {
  song: Song
}

export const PreviewPanel = ({ song }: PreviewPanelProps) => {
  const parsedSections = useMemo(
    () => song.sections.map((s) => ({ ...s, parsed: parseSectionContent(s.content) })),
    [song.sections]
  )

  return (
    <aside className="w-1/2 border-l border-slate-200 bg-white px-8 py-10 print:w-full print:border-none print:px-0 print:py-0">
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

      <div className="mt-6 space-y-6">
        {parsedSections.map((section) => {
          const content = section.parsed
          return (
            <div key={`${section.id}-preview`} className="print-avoid-break">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 print:text-slate-600">
                {section.name}
              </p>
              <div className="mt-3 space-y-4">
                {content.lines.map((line) => (
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
                      <div className="text-sm text-slate-800 print:text-black">{line.lyrics}</div>
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
    </aside>
  )
}
