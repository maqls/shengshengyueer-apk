import { httpRequest, parseJson, type HttpResult } from './http'

function modelScore(name: string): number {
  const n = name.toLowerCase()
  let score = 0
  if (/vl|vision|multimodal|image|llava|qwen3-vl/.test(n)) score += 1000
  const sizeMatch = n.match(/(\d+(?:\.\d+)?)\s*b/)
  if (sizeMatch) score += parseFloat(sizeMatch[1]) * 10
  if (/70b|72b|32b|27b|14b|13b/.test(n)) score += 500
  return score
}

export async function listOllamaModels(baseUrl: string, timeoutMs = 5000): Promise<string[]> {
  const base = baseUrl.replace(/\/$/, '')
  try {
    const res = await httpRequest(`${base}/api/tags`, { timeoutMs })
    if (!res.ok) return []
    const data = parseJson<{ models?: { name?: string }[] }>(res)
    const names = (data.models ?? []).map((m) => m.name).filter((n): n is string => Boolean(n))
    return names.sort((a, b) => modelScore(a) - modelScore(b))
  } catch {
    return []
  }
}

export interface ProbeResult {
  label: string
  url: string
  status: number | null
  ok: boolean
  preview: string
}

export async function probeOllama(baseUrl: string, model: string, timeoutMs = 8000): Promise<ProbeResult[]> {
  const base = baseUrl.replace(/\/$/, '')
  const targets: { label: string; url: string; init?: { method: string; body: string } }[] = [
    { label: 'GET /api/tags', url: `${base}/api/tags`, init: undefined },
    {
      label: 'POST /v1/chat/completions',
      url: `${base}/v1/chat/completions`,
      init: {
        method: 'POST',
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }], stream: false, max_tokens: 5 })
      }
    },
    {
      label: 'POST /api/chat',
      url: `${base}/api/chat`,
      init: {
        method: 'POST',
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }], stream: false, options: { num_predict: 5 } })
      }
    },
    {
      label: 'POST /api/generate',
      url: `${base}/api/generate`,
      init: {
        method: 'POST',
        body: JSON.stringify({ model, prompt: 'hi', stream: false, options: { num_predict: 5 } })
      }
    }
  ]

  const results: ProbeResult[] = []
  for (const target of targets) {
    try {
      const res: HttpResult = await httpRequest(target.url, {
        method: target.init?.method ?? 'GET',
        headers: target.init ? { 'Content-Type': 'application/json' } : undefined,
        body: target.init?.body,
        timeoutMs
      })
      results.push({
        label: target.label,
        url: target.url,
        status: res.status,
        ok: res.ok,
        preview: res.text.slice(0, 200)
      })
    } catch (err) {
      results.push({
        label: target.label,
        url: target.url,
        status: null,
        ok: false,
        preview: `请求异常：${err instanceof Error ? err.message : String(err)}`
      })
    }
  }
  return results
}
