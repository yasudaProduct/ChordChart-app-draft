import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  email: string
  name?: string
}

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  hydrate: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
}

const toUser = (su: SupabaseUser): User => ({
  id: su.id,
  email: su.email ?? '',
  name: su.user_metadata?.display_name ?? undefined,
})

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  /**
   * 認証状態を初期化する
   */
  hydrate: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      set({
        session,
        user: session?.user ? toUser(session.user) : null,
        isLoading: false,
      })

      // 認証状態が変化したときに呼び出される
      // ログイン/ログアウト/更新を検知し、ストアを更新する
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ? toUser(session.user) : null,
        })
      })
    } catch {
      set({ isLoading: false })
    }
  },

  /**
   * ログインする
   * @param email メールアドレス
   * @param password パスワード
   * @returns エラーがあればエラーメッセージを返す
   */
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return { error: error.message }
    return {}
  },

  /**
   * 新規登録する
   * @param email メールアドレス
   * @param password パスワード
   * @param name 名前
   * @returns エラーがあればエラーメッセージを返す
   */
  signUp: async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: name ? { data: { display_name: name } } : undefined,
    })
    if (error) return { error: error.message }
    return {}
  },

  /**
   * ログアウトする
   */
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
