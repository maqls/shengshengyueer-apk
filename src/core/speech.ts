import { TextToSpeech } from '@capacitor-community/text-to-speech'

function isNative(): boolean {
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    return typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform()
  } catch {
    return false
  }
}

function webSpeak(text: string, lang: string, rate: number): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)
}

export async function speak(text: string, lang = 'zh-CN', rate = 0.9): Promise<void> {
  if (!text.trim()) return
  if (isNative()) {
    try {
      await TextToSpeech.stop()
      await TextToSpeech.speak({
        text,
        lang,
        rate,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient'
      })
      return
    } catch {
      // 插件失败回退 Web
    }
  }
  webSpeak(text, lang, rate)
}

export function speakEnglish(text: string): Promise<void> {
  return speak(text, 'en-US', 0.85)
}

export function speakChinese(text: string): Promise<void> {
  return speak(text, 'zh-CN', 0.9)
}

export function speechSupported(): boolean {
  return true
}
