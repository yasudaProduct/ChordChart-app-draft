'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export const useRequireAuth = () => {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = !!user

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
