import { create } from 'zustand'

export type AuthModalMode = 'login' | 'register'

interface AuthModalState {
  isOpen: boolean
  mode: AuthModalMode
  redirectComplete: string
  open: (mode: AuthModalMode, redirectComplete?: string) => void
  setMode: (mode: AuthModalMode) => void
  close: () => void
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: 'login',
  redirectComplete: '/songs',
  open: (mode, redirectComplete = '/songs') => set({ isOpen: true, mode, redirectComplete }),
  setMode: (mode) => set({ mode }),
  close: () => set({ isOpen: false }),
}))
