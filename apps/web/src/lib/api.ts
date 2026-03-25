export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? '/api'
}

function getCookie(name: string) {
  return document.cookie
    .split('; ')
    .find((part) => part.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')
}

export function resolveApiAssetUrl(path: string | null | undefined) {
  if (!path) {
    return ''
  }

  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }

  const apiBaseUrl = getApiBaseUrl()
  if (!/^https?:\/\//i.test(apiBaseUrl)) {
    return path
  }

  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '/')
  return new URL(path, apiOrigin).toString()
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isJsonBody = init.body && !(init.body instanceof FormData)
  const headers = new Headers(init.headers)
  if (isJsonBody) {
    headers.set('Content-Type', 'application/json')
  }
  if (!['GET', 'HEAD'].includes(init.method ?? 'GET')) {
    const csrf = getCookie('lm_csrf')
    if (csrf) {
      headers.set('x-csrf-token', decodeURIComponent(csrf))
    }
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError((data as any)?.message ?? 'Request failed', response.status, data)
  }
  return data as T
}
