'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

/**
 * 認証が必要なページにアクセスしたときにログインページにリダイレクトする
 */
export const useRequireAuth = () => {
  const router = useRouter()
  const session = useAuthStore((s) => s.session)
  const isAuthenticated = !!session

  /**
   * ログインページにリダイレクトする
   */
  const redirectToLogin = useCallback(() => {
    const currentPath = window.location.pathname + window.location.search
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
  }, [router])

  const requireAuth = useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        action()
      } else {
        redirectToLogin()
      }
    },
    [isAuthenticated, redirectToLogin]
  )

  return { isAuthenticated, requireAuth, redirectToLogin }
}
