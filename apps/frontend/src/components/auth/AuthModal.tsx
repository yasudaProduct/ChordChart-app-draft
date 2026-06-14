'use client'

import { useEffect } from 'react'
import { useAuthModalStore } from '@/stores/authModalStore'
import { useAuthStore } from '@/stores/authStore'
import { AuthForm } from './AuthForm'

export const AuthModal = () => {
  const { isOpen, mode, redirectComplete, setMode, close } = useAuthModalStore()
  const user = useAuthStore((s) => s.user)

  // すでにログイン済みなら開かない（保険）
  useEffect(() => {
    if (isOpen && user) close()
  }, [isOpen, user, close])

  // ESC で閉じる
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border border-white/60 bg-white p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="閉じる"
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
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

        <AuthForm mode={mode} onModeChange={setMode} redirectComplete={redirectComplete} />
      </div>
    </div>
  )
}
