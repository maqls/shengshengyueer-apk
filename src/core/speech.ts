export function speak(text: string, lang = 'zh-CN', rate = 0.9): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)
}

export function speakEnglish(text: string): void {
  speak(text, 'en-US', 0.85)
}

export function speakChinese(text: string): void {
  speak(text, 'zh-CN', 0.9)
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
