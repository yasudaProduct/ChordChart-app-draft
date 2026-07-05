const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

/** API エラーから HTTP ステータスを取り出す（fetch 失敗等で無い場合は undefined）。 */
export const getApiErrorStatus = (error: unknown): number | undefined => {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: unknown }).status
    return typeof status === 'number' ? status : undefined
  }
  return undefined
}

let getToken: (() => Promise<string | null>) | null = null

export function setTokenGetter(fn: () => Promise<string | null>) {
  getToken = fn
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  headers?: Record<string, string>
}

async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const token = getToken ? await getToken() : null

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

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
    // 呼び出し側で 404 等を判別できるよう HTTP ステータスを付与する
    throw Object.assign(error, { status: response.status })
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

export const api = {
  get: <T>(endpoint: string) => apiClient<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) => apiClient<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body: unknown) => apiClient<T>(endpoint, { method: 'PUT', body }),
  patch: <T>(endpoint: string, body: unknown) => apiClient<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) => apiClient<T>(endpoint, { method: 'DELETE' }),
}
