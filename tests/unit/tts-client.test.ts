import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the ws module before importing the client
vi.mock('ws', () => {
  const WS = vi.fn()
  WS.prototype.on = vi.fn()
  WS.prototype.send = vi.fn()
  WS.prototype.terminate = vi.fn()
  return { default: WS }
})

// Mock fetch for fetchVoices
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import WS from 'ws'
import { fetchVoices } from '@/lib/tts/edge-tts-client'

// Helpers to simulate WebSocket events
function getWsInstance(): {
  on: ReturnType<typeof vi.fn>
  send: ReturnType<typeof vi.fn>
  terminate: ReturnType<typeof vi.fn>
} {
  const instances = (WS as unknown as ReturnType<typeof vi.fn>).mock.instances
  return instances[instances.length - 1]
}

function fireEvent(ws: ReturnType<typeof getWsInstance>, event: string, ...args: unknown[]) {
  const calls = (ws.on as ReturnType<typeof vi.fn>).mock.calls as [
    string,
    (...a: unknown[]) => void,
  ][]
  const handler = calls.find(([e]) => e === event)?.[1]
  handler?.(...args)
}

describe('fetchVoices', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns a list of voices', async () => {
    const mockVoices = [
      {
        ShortName: 'en-US-JennyNeural',
        FriendlyName: 'Jenny',
        Gender: 'Female',
        Locale: 'en-US',
        SuggestedCodec: 'audio-24khz-96kbitrate-mono-mp3',
        Status: 'GA',
      },
      {
        ShortName: 'en-US-GuyNeural',
        FriendlyName: 'Guy',
        Gender: 'Male',
        Locale: 'en-US',
        SuggestedCodec: 'audio-24khz-96kbitrate-mono-mp3',
        Status: 'GA',
      },
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVoices,
    })
    const voices = await fetchVoices()
    expect(voices).toHaveLength(2)
    expect(voices[0].ShortName).toBe('en-US-JennyNeural')
  })

  it('throws when the HTTP request fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })
    await expect(fetchVoices()).rejects.toThrow(/HTTP 503/)
  })
})

describe('synthesize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws for empty text', async () => {
    const { synthesize } = await import('@/lib/tts/edge-tts-client')
    await expect(synthesize('', 'en-US-JennyNeural')).rejects.toThrow(/empty/)
  })

  it('throws for empty voice', async () => {
    const { synthesize } = await import('@/lib/tts/edge-tts-client')
    await expect(synthesize('Hello', '')).rejects.toThrow(/voice/i)
  })

  it('resolves with audio buffer when turn.end is received', async () => {
    const { synthesize } = await import('@/lib/tts/edge-tts-client')
    const promise = synthesize('Hello world', 'en-US-JennyNeural')

    const ws = getWsInstance()

    // Simulate open event
    fireEvent(ws, 'open')

    // Simulate binary audio frame
    const header = 'X-RequestId:abc\r\nPath:audio\r\n\r\n'
    const headerBuf = Buffer.from(header, 'utf8')
    const audioBuf = Buffer.from([0x01, 0x02, 0x03])
    const frame = Buffer.alloc(2 + headerBuf.length + audioBuf.length)
    frame.writeUInt16BE(headerBuf.length, 0)
    headerBuf.copy(frame, 2)
    audioBuf.copy(frame, 2 + headerBuf.length)
    fireEvent(ws, 'message', frame, true)

    // Simulate turn.end
    fireEvent(ws, 'message', 'Path:turn.end\r\n\r\n', false)

    const result = await promise
    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(0)
  })

  it('rejects when no audio data is received before turn.end', async () => {
    const { synthesize } = await import('@/lib/tts/edge-tts-client')
    const promise = synthesize('Hello', 'en-US-JennyNeural')

    const ws = getWsInstance()
    fireEvent(ws, 'open')
    fireEvent(ws, 'message', 'Path:turn.end\r\n\r\n', false)

    await expect(promise).rejects.toThrow(/no audio data/i)
  })

  it('rejects on WebSocket error', async () => {
    const { synthesize } = await import('@/lib/tts/edge-tts-client')
    const promise = synthesize('Hello', 'en-US-JennyNeural')

    const ws = getWsInstance()
    fireEvent(ws, 'open')
    fireEvent(ws, 'error', new Error('Connection refused'))

    await expect(promise).rejects.toThrow('Connection refused')
  })
})
