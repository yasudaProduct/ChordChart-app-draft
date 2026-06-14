'use client'

import { useState } from 'react'
import { useSignIn, useSignUp } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import type { AuthModalMode } from '@/stores/authModalStore'

type AuthFormProps = {
  mode: AuthModalMode
  onModeChange: (mode: AuthModalMode) => void
  redirectComplete?: string
}

const COPY: Record<AuthModalMode, { title: string; subtitle: string; cta: string }> = {
  login: {
    title: 'おかえりなさい',
    subtitle: 'Google アカウントでログインして、コード譜の続きを。',
    cta: 'Google でログイン',
  },
  register: {
    title: 'ChordBook をはじめる',
    subtitle: 'Google アカウントで登録して、すぐにコード譜を作成。',
    cta: 'Google で新規登録',
  },
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
    />
  </svg>
)

export const AuthForm = ({ mode, onModeChange, redirectComplete = '/songs' }: AuthFormProps) => {
  const { signIn, isLoaded: isSignInLoaded } = useSignIn()
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoaded = isSignInLoaded && isSignUpLoaded
  const copy = COPY[mode]

  const handleGoogle = async () => {
    if (!isLoaded || isSubmitting) return
    setError('')
    setIsSubmitting(true)
    try {
      const strategy = 'oauth_google'
      const options = {
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: redirectComplete,
      } as const

      if (mode === 'register') {
        await signUp!.authenticateWithRedirect(options)
      } else {
        await signIn!.authenticateWithRedirect(options)
      }
    } catch {
      setError('Google 認証を開始できませんでした。時間をおいて再度お試しください。')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-display text-lg font-semibold tracking-tight text-slate-900">
          ChordBook
        </span>
        <h2 className="font-display text-xl font-semibold text-slate-900">{copy.title}</h2>
        <p className="text-sm text-slate-500">{copy.subtitle}</p>
      </div>

      <div className="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setError('')
              onModeChange(m)
            }}
            className={cn(
              'flex-1 rounded-full px-4 py-2 transition',
              mode === m
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {m === 'login' ? 'ログイン' : '新規登録'}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={!isLoaded || isSubmitting}
        className="flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        {isSubmitting ? 'リダイレクト中...' : copy.cta}
      </button>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-center text-xs text-red-600">
          {error}
        </p>
      )}

      <p className="text-center text-xs text-slate-400">
        続行することで利用規約とプライバシーポリシーに同意したものとみなされます。
      </p>
    </div>
  )
}
