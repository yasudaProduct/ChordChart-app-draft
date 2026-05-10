'use client'

import { useMemo } from 'react'
import { parseSectionContent } from '@/lib/sectionContent'
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
    <aside className="w-1/2 border-l border-slate-200 bg-white px-8 py-10">
      <div className="border-b-2 border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-900">{song.title}</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>{song.artist || 'アーティスト未設定'}</span>
          <span>Key: {song.key || '-'}</span>
          <span>BPM: {song.bpm ?? '-'}</span>
          <span>{song.timeSignature}</span>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {parsedSections.map((section) => {
          const content = section.parsed
          return (
            <div key={`${section.id}-preview`}>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                {section.name}
              </p>
              <div className="mt-3 space-y-4">
                {content.lines.map((line) => (
                  <div key={line.id} className="space-y-1">
                    <div className="relative h-6">
                      {line.chords.map((chord) => (
                        <span
                          key={chord.id}
                          className="absolute text-sm font-semibold text-primary"
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
                      <div className="text-sm text-slate-800">{line.lyrics}</div>
                    )}
                  </div>
                ))}
                {content.lines.length === 0 && (
                  <div className="text-sm text-slate-400">（未入力）</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
