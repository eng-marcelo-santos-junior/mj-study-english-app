// TTS synthesis via Google Translate TTS (HTTP GET, no WebSocket, no API key needed).
// Voice selection is not supported — one voice per language.
// Replaces the original Edge TTS WebSocket approach which is blocked from Vercel IPs.

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

// Google Translate language codes differ from BCP-47 locale codes in some cases.
const LANG_MAP: Record<string, string> = {
  'en-US': 'en',
  'en-GB': 'en',
  'pt-BR': 'pt',
  'es-ES': 'es',
  'es-MX': 'es',
  'fr-FR': 'fr',
  'de-DE': 'de',
  'it-IT': 'it',
  'ja-JP': 'ja',
  'zh-CN': 'zh-CN',
}

export interface EdgeVoice {
  ShortName: string
  Locale: string
  FriendlyName: string
}

export function getLanguages(): { code: string; label: string }[] {
  return [
    { code: 'en-US', label: 'English (United States)' },
    { code: 'en-GB', label: 'English (United Kingdom)' },
    { code: 'pt-BR', label: 'Portuguese (Brazil)' },
    { code: 'es-ES', label: 'Spanish (Spain)' },
    { code: 'es-MX', label: 'Spanish (Mexico)' },
    { code: 'fr-FR', label: 'French (France)' },
    { code: 'de-DE', label: 'German (Germany)' },
    { code: 'it-IT', label: 'Italian (Italy)' },
    { code: 'ja-JP', label: 'Japanese (Japan)' },
    { code: 'zh-CN', label: 'Chinese (Simplified)' },
  ]
}

export async function synthesize(text: string, language: string): Promise<Buffer> {
  if (!text.trim()) throw new Error('Text cannot be empty')
  if (!language.trim()) throw new Error('Language must be specified')

  const lang = LANG_MAP[language] ?? language.split('-')[0]

  const url = new URL('https://translate.google.com/translate_tts')
  url.searchParams.set('ie', 'UTF-8')
  url.searchParams.set('q', text)
  url.searchParams.set('tl', lang)
  url.searchParams.set('client', 'tw-ob')
  url.searchParams.set('ttsspeed', '1')

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      Referer: 'https://translate.google.com/',
      Accept: 'audio/mpeg, audio/*',
    },
  })

  if (!res.ok) {
    throw new Error(`TTS request failed: HTTP ${res.status}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  if (arrayBuffer.byteLength === 0) throw new Error('TTS service returned empty audio')
  return Buffer.from(arrayBuffer)
}
