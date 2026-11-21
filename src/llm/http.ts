export interface HttpResult {
  status: number
  ok: boolean
  text: string
}

export interface HttpOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
  timeoutMs?: number
}

export function httpRequest(url: string, options: HttpOptions = {}): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(options.method ?? 'GET', url, true)
    for (const [key, value] of Object.entries(options.headers ?? {})) {
      xhr.setRequestHeader(key, value)
    }
    xhr.timeout = options.timeoutMs ?? 180000
    xhr.onload = () => {
      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        text: xhr.responseText ?? ''
      })
    }
    xhr.onerror = () => reject(new Error(`网络错误：${url}`))
    xhr.ontimeout = () => reject(new Error(`请求超时：${url}`))
    xhr.onabort = () => reject(new Error(`请求中断：${url}`))
    try {
      xhr.send(options.body ?? null)
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

export function parseJson<T>(result: HttpResult): T {
  return JSON.parse(result.text) as T
}
