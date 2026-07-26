'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

type ModalWidth = 'sm' | 'md' | 'lg'

type ModalProps = {
  /** 見出しとして表示し、スクリーンリーダー用のラベルにも使う */
  title: string
  onClose: () => void
  width?: ModalWidth
  children: React.ReactNode
}

const widthStyles: Record<ModalWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

/**
 * オーバーレイ付きの中央モーダル。
 * ESC・オーバーレイクリックで閉じ、開いている間は背面のスクロールを止める。
 */
export const Modal = ({ title, onClose, width = 'md', children }: ModalProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // 背面のスクロールを止める（モーダルを閉じたら元に戻す）
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          'relative flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-3xl border border-white/60 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]',
          widthStyles[width]
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="-mr-1 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6">{children}</div>
      </div>
    </div>
  )
}
