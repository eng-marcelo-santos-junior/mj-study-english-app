import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { synthesize, getLanguages } from '@/lib/tts/edge-tts-client'

function mockAudioResponse(bytes: number[] = [0x49, 0x44, 0x33]) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
  })
}

describe('getLanguages', () => {
  it('returns a non-empty array', () => {
    expect(getLanguages().length).toBeGreaterThan(0)
  })

  it('includes en-US and pt-BR', () => {
    const codes = getLanguages().map((l) => l.code)
    expect(codes).toContain('en-US')
    expect(codes).toContain('pt-BR')
  })
})

describe('synthesize (Google TTS fallback)', () => {
  beforeEach(() => mockFetch.mockReset())

  it('throws for empty text', async () => {
    await expect(synthesize('', 'en-US')).rejects.toThrow(/empty/)
  })

  it('throws for whitespace-only text', async () => {
    await expect(synthesize('   ', 'en-US')).rejects.toThrow(/empty/)
  })

  it('throws for empty language', async () => {
    await expect(synthesize('Hello', '')).rejects.toThrow(/language/i)
  })

  it('returns a Buffer when fetch succeeds', async () => {
    mockAudioResponse()
    const result = await synthesize('Hello world', 'en-US')
    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(0)
  })

  it('throws when HTTP status is not ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 })
    await expect(synthesize('Hello', 'en-US')).rejects.toThrow(/HTTP 429/)
  })

  it('throws when response body is empty', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })
    await expect(synthesize('Hello', 'en-US')).rejects.toThrow(/empty/)
  })

  it('maps en-US to "en" in the Google TTS URL', async () => {
    mockAudioResponse()
    await synthesize('Hello', 'en-US')
    expect(mockFetch.mock.calls[0][0]).toContain('tl=en')
  })

  it('maps pt-BR to "pt" in the Google TTS URL', async () => {
    mockAudioResponse()
    await synthesize('Olá', 'pt-BR')
    expect(mockFetch.mock.calls[0][0]).toContain('tl=pt')
  })

  it('maps zh-CN to "zh-CN" in the Google TTS URL', async () => {
    mockAudioResponse()
    await synthesize('你好', 'zh-CN')
    expect(mockFetch.mock.calls[0][0]).toContain('tl=zh-CN')
  })

  it('falls back to the language prefix for unmapped locales', async () => {
    mockAudioResponse()
    await synthesize('Hola', 'xx-YY')
    expect(mockFetch.mock.calls[0][0]).toContain('tl=xx')
  })

  it('encodes the text as a query param', async () => {
    mockAudioResponse()
    await synthesize('Test phrase', 'en-US')
    expect(mockFetch.mock.calls[0][0]).toContain('q=Test+phrase')
  })
})
