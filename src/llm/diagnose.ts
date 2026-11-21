export interface ProbeResult {
  label: string
  url: string
  status: number | null
  ok: boolean
  preview: string
}

export async function probeOllama(baseUrl: string, model: string, timeoutMs = 8000): Promise<ProbeResult[]> {
  const base = baseUrl.replace(/\/$/, '')
  const targets: { label: string; url: string; init?: RequestInit }[] = [
    { label: '模型列表 GET /api/tags', url: `${base}/api/tags` },
    {
      label: 'OpenAI 端点 POST /v1/chat/completions',
      url: `${base}/v1/chat/completions`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }], stream: false, max_tokens: 5 })
      }
    },
    {
      label: '原生端点 POST /api/chat',
      url: `${base}/api/chat`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }], stream: false, options: { num_predict: 5 } })
      }
    },
    {
      label: '最简端点 POST /api/generate',
      url: `${base}/api/generate`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: 'hi', stream: false, options: { num_predict: 5 } })
      }
    }
  ]

  const results: ProbeResult[] = []
  for (const target of targets) {
    try {
      const res = await Promise.race([
        fetch(target.url, target.init),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('超时')), timeoutMs))
      ])
      const text = (await res.text()).slice(0, 200)
      results.push({ label: target.label, url: target.url, status: res.status, ok: res.ok, preview: text })
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
