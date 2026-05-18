import WS from 'ws'
import { randomUUID, createHash } from 'crypto'

const TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const CHROMIUM_VERSION = '130.0.2849.68'
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_VERSION}`
const USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_VERSION} Safari/537.36 Edg/${CHROMIUM_VERSION}`

const VOICES_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${TOKEN}`
const WSS_BASE = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TOKEN}`

// Microsoft added a challenge-response token in v6+ of the Edge TTS protocol.
// Sec-MS-GEC = SHA256(Windows_FILETIME_rounded_to_3s_bucket + TOKEN).toUpperCase()
// Uses BigInt() constructor (not literals) for ES2017 compatibility.
function getSecMsGec(): string {
  const epoch = BigInt(10000) * BigInt(Date.now()) + BigInt('116444736000000000')
  const bucket = BigInt(3000000000)
  const rounded = epoch - (epoch % bucket)
  return createHash('sha256').update(`${rounded}${TOKEN}`).digest('hex').toUpperCase()
}

function getWsHeaders(): Record<string, string> {
  return {
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    Pragma: 'no-cache',
    'Sec-MS-GEC': getSecMsGec(),
    'Sec-MS-GEC-Version': SEC_MS_GEC_VERSION,
    'User-Agent': USER_AGENT,
  }
}

const VOICES_HEADERS = {
  'Accept-Encoding': 'gzip, deflate, br',
  'User-Agent': USER_AGENT,
}

export interface EdgeVoice {
  Name: string
  ShortName: string
  Gender: 'Male' | 'Female'
  Locale: string
  SuggestedCodec: string
  FriendlyName: string
  Status: string
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildSpeechConfig(): string {
  const body = JSON.stringify({
    context: {
      synthesis: {
        audio: {
          metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false },
          outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
        },
      },
    },
  })
  return [
    `X-Timestamp:${new Date().toISOString()}`,
    'Content-Type:application/json; charset=utf-8',
    'Path:speech.config',
    '',
    body,
  ].join('\r\n')
}

function buildSSML(text: string, voice: string): string {
  const requestId = randomUUID().replace(/-/g, '')
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody rate='+0%' pitch='+0Hz'>${escapeXml(text)}</prosody></voice></speak>`
  return [
    `X-RequestId:${requestId}`,
    'Content-Type:application/ssml+xml',
    `X-Timestamp:${new Date().toISOString()}`,
    'Path:ssml',
    '',
    ssml,
  ].join('\r\n')
}

export async function synthesize(text: string, voice: string): Promise<Buffer> {
  if (!text.trim()) throw new Error('Text cannot be empty')
  if (!voice.trim()) throw new Error('Voice must be specified')

  return new Promise((resolve, reject) => {
    const connectionId = randomUUID().replace(/-/g, '')
    const ws = new WS(`${WSS_BASE}&ConnectionId=${connectionId}`, {
      headers: getWsHeaders(),
    })

    const chunks: Buffer[] = []
    let done = false

    const finish = (result: Buffer | Error) => {
      if (done) return
      done = true
      clearTimeout(timer)
      ws.terminate()
      if (result instanceof Error) reject(result)
      else resolve(result)
    }

    const timer = setTimeout(
      () => finish(new Error('TTS synthesis timed out after 30 seconds')),
      30_000
    )

    ws.on('open', () => {
      ws.send(buildSpeechConfig())
      ws.send(buildSSML(text, voice))
    })

    ws.on('message', (data: WS.RawData, isBinary: boolean) => {
      if (isBinary) {
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer)
        const headerLen = buf.readUInt16BE(0)
        const header = buf.subarray(2, 2 + headerLen).toString('utf8')
        const audio = buf.subarray(2 + headerLen)
        if (header.includes('Path:audio') && audio.length > 0) {
          chunks.push(audio)
        }
      } else {
        const msg = data.toString()
        if (msg.includes('Path:turn.end')) {
          if (chunks.length === 0) {
            finish(new Error('TTS service returned no audio data'))
          } else {
            finish(Buffer.concat(chunks))
          }
        }
      }
    })

    ws.on('error', finish)
  })
}

export async function fetchVoices(): Promise<EdgeVoice[]> {
  const res = await fetch(VOICES_URL, { headers: VOICES_HEADERS })
  if (!res.ok) throw new Error(`Failed to fetch voice list: HTTP ${res.status}`)
  return res.json() as Promise<EdgeVoice[]>
}
