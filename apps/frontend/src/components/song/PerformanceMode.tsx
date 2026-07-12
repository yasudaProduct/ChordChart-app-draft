'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TransposeControl } from '@/components/song/TransposeControl'
import { transposeSong } from '@/lib/music'
import { parseSectionContent } from '@/lib/sectionContent'
import type { Song } from '@/types/song'

type PerformanceModeProps = {
  song: Song
  /** 閲覧画面で設定済みの移調量を引き継ぐ */
  initialTranspose?: number
  onClose: () => void
}

const MIN_SPEED = 0.25
const MAX_SPEED = 3
const SPEED_STEP = 0.25
const MIN_FONT = 0.8
const MAX_FONT = 1.6
const FONT_STEP = 0.1

/** BPM から自動スクロールの基準速度（px/秒）を算出する。 */
const basePixelsPerSecond = (bpm: number | undefined) => ((bpm ?? 100) / 60) * 8

export const PerformanceMode = ({ song, initialTranspose = 0, onClose }: PerformanceModeProps) => {
  const [transpose, setTranspose] = useState(initialTranspose)
  const [isPlaying, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [fontScale, setFontScale] = useState(1)

  const scrollRef = useRef<HTMLDivElement>(null)

  const displaySong = useMemo(
    () => (transpose === 0 ? song : transposeSong(song, transpose)),
    [song, transpose]
  )

  const parsedSections = useMemo(
    () =>
      displaySong.sections.map((section) => ({
        ...section,
        parsed: parseSectionContent(section.content),
      })),
    [displaySong.sections]
  )

  const togglePlaying = useCallback(() => setPlaying((prev) => !prev), [])

  // 自動スクロール（BPM 連動 × 速度倍率）
  useEffect(() => {
    if (!isPlaying) return
    let rafId = 0
    let lastTime: number | null = null

    const step = (time: number) => {
      const container = scrollRef.current
      if (!container) return
      if (lastTime !== null) {
        const deltaSeconds = (time - lastTime) / 1000
        container.scrollTop += basePixelsPerSecond(song.bpm) * speed * deltaSeconds
        // 最下部に到達したら停止
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
          setPlaying(false)
          return
        }
      }
      lastTime = time
      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [isPlaying, speed, song.bpm])

  // キーボード操作: Space=再生/停止, Esc=終了, ↑↓=速度
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === ' ') {
        event.preventDefault()
        togglePlaying()
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSpeed((prev) => Math.min(MAX_SPEED, prev + SPEED_STEP))
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSpeed((prev) => Math.max(MIN_SPEED, prev - SPEED_STEP))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, togglePlaying])

  // 演奏中の画面消灯を防ぐ（Wake Lock API・対応ブラウザのみ）
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    let released = false

    const requestWakeLock = async () => {
      try {
        wakeLock = (await navigator.wakeLock?.request('screen')) ?? null
      } catch {
        // 非対応・省電力モード等では黙って諦める
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !released) {
        void requestWakeLock()
      }
    }

    void requestWakeLock()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void wakeLock?.release().catch(() => {})
    }
  }, [])

  // 背面ページのスクロールを固定
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-slate-950 text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label="演奏モード"
    >
      {/* ヘッダー */}
      <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-6 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{displaySong.title}</h2>
          <p className="truncate text-xs text-slate-400">
            {displaySong.artist || 'アーティスト未設定'} · Key {displaySong.key || '-'} · BPM{' '}
            {displaySong.bpm ?? '-'} · {displaySong.timeSignature}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          ✕ 終了 (Esc)
        </button>
      </header>

      {/* コード譜 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div
          className="mx-auto w-full max-w-3xl px-6 py-10 pb-[60vh]"
          style={{ fontSize: `${Math.round(fontScale * 100)}%` }}
        >
          {parsedSections.map((section) => (
            <section key={section.id} className="mb-[2em]">
              <p className="text-[0.75em] font-semibold uppercase tracking-[0.25em] text-slate-500">
                {section.name}
              </p>
              <div className="mt-[0.75em] space-y-[1.25em]">
                {section.parsed.lines.map((line) => (
                  <div key={line.id}>
                    <div className="relative h-[1.6em]">
                      {line.chords.map((chord) => (
                        <span
                          key={chord.id}
                          className="absolute text-[1.15em] font-bold text-indigo-300"
                          style={{ left: `${chord.offset * 100}%`, transform: 'translateX(-50%)' }}
                        >
                          {chord.chord}
                        </span>
                      ))}
                    </div>
                    {section.type === 'lyrics-chord' && (
                      <div className="text-[1em] leading-relaxed text-slate-100">
                        {line.lyrics || '　'}
                      </div>
                    )}
                  </div>
                ))}
                {section.parsed.lines.length === 0 && (
                  <div className="text-[0.9em] text-slate-600">（未入力）</div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* コントロールバー */}
      <footer className="border-t border-slate-800 bg-slate-950/95 px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={togglePlaying}
            aria-label={isPlaying ? '自動スクロールを停止' : '自動スクロールを開始'}
            className="rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            {isPlaying ? '⏸ 停止' : '▶ 再生'}
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="text-slate-500">速度</span>
            <button
              type="button"
              onClick={() => setSpeed((prev) => Math.max(MIN_SPEED, prev - SPEED_STEP))}
              aria-label="スクロールを遅くする"
              className="rounded-full border border-slate-700 px-2 py-0.5 font-semibold transition hover:border-slate-500"
            >
              −
            </button>
            <span className="min-w-10 text-center font-mono">×{speed.toFixed(2)}</span>
            <button
              type="button"
              onClick={() => setSpeed((prev) => Math.min(MAX_SPEED, prev + SPEED_STEP))}
              aria-label="スクロールを速くする"
              className="rounded-full border border-slate-700 px-2 py-0.5 font-semibold transition hover:border-slate-500"
            >
              ＋
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="text-slate-500">文字</span>
            <button
              type="button"
              onClick={() => setFontScale((prev) => Math.max(MIN_FONT, prev - FONT_STEP))}
              aria-label="文字を小さくする"
              className="rounded-full border border-slate-700 px-2 py-0.5 font-semibold transition hover:border-slate-500"
            >
              A−
            </button>
            <button
              type="button"
              onClick={() => setFontScale((prev) => Math.min(MAX_FONT, prev + FONT_STEP))}
              aria-label="文字を大きくする"
              className="rounded-full border border-slate-700 px-2 py-0.5 font-semibold transition hover:border-slate-500"
            >
              A＋
            </button>
          </div>

          <TransposeControl semitones={transpose} onChange={setTranspose} baseKey={song.key} />

          <span className="hidden text-[10px] text-slate-600 sm:inline">
            Space: 再生/停止 · ↑↓: 速度 · Esc: 終了
          </span>
        </div>
      </footer>
    </div>
  )
}
