'use client'

import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthModalStore } from '@/stores/authModalStore'

export const useRequireAuth = () => {
  const user = useAuthStore((s) => s.user)
  const openAuthModal = useAuthModalStore((s) => s.open)
  const isAuthenticated = !!user

  const redirectToLogin = useCallback(() => {
    const currentPath = window.location.pathname + window.location.search
    openAuthModal('login', currentPath)
  }, [openAuthModal])

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
