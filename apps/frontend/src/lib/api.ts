import { supabase } from '@/lib/supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  headers?: Record<string, string>
}

/**
 * 認証トークンを取得する
 * @returns 認証トークン
 */
async function getAuthToken(): Promise<string | null> {

  // supabase から認証トークンを取得する
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/**
 * API クライアント
 * @param endpoint エンドポイント
 * @param options リクエストオプション
 * @returns API レスポンス
 * @example
 * const response = await apiClient<Song[]>('/songs')
 */
async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const token = await getAuthToken()

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  // リクエストを送信する
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'エラーが発生しました',
      code: 'UNKNOWN_ERROR',
    }))
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

/**
 * API クライアント
 * @param endpoint エンドポイント
 * @param options リクエストオプション
 * @returns API レスポンス
 * @example
 * const response = await api.get<Song[]>('/songs')
 */
export const api = {
  get: <T>(endpoint: string) => apiClient<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, { method: 'PUT', body }),
  patch: <T>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) => apiClient<T>(endpoint, { method: 'DELETE' }),
}
