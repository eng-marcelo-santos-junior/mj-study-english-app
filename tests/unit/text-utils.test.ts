import { describe, it, expect } from 'vitest'
import { cleanHtmlText, calculateTextHash } from '@/lib/tts/text-utils'

describe('cleanHtmlText', () => {
  it('strips basic HTML tags', () => {
    expect(cleanHtmlText('<p>Hello world</p>')).toBe('Hello world')
  })

  it('strips nested tags and preserves text', () => {
    const result = cleanHtmlText('<p>Hello, <strong>Marcelo</strong>! How are you?</p>')
    expect(result).toContain('Hello')
    expect(result).toContain('Marcelo')
    expect(result).toContain('How are you?')
    expect(result).not.toContain('<')
  })

  it('decodes common HTML entities', () => {
    expect(cleanHtmlText('<p>5 &amp; 3 &lt; 10</p>')).toBe('5 & 3 < 10')
  })

  it('decodes &nbsp; to space', () => {
    expect(cleanHtmlText('hello&nbsp;world')).toBe('hello world')
  })

  it('collapses multiple whitespace into single space', () => {
    expect(cleanHtmlText('<p>  lots   of   spaces  </p>')).toBe('lots of spaces')
  })

  it('returns empty string for empty input', () => {
    expect(cleanHtmlText('')).toBe('')
  })

  it('handles text without any HTML', () => {
    expect(cleanHtmlText('plain text')).toBe('plain text')
  })

  it('removes script tag content', () => {
    const result = cleanHtmlText('<p>Real text</p><script>alert(1)</script>')
    expect(result).not.toContain('alert')
    expect(result).toContain('Real text')
  })

  it('preserves punctuation for TTS entonation', () => {
    const result = cleanHtmlText('<p>Wait... are you sure?</p>')
    expect(result).toBe('Wait... are you sure?')
  })
})

describe('calculateTextHash', () => {
  it('returns a 16-character hex string', () => {
    const hash = calculateTextHash('hello')
    expect(hash).toHaveLength(16)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('returns the same hash for the same text', () => {
    const a = calculateTextHash('consistent text')
    const b = calculateTextHash('consistent text')
    expect(a).toBe(b)
  })

  it('returns different hashes for different texts', () => {
    const a = calculateTextHash('text one')
    const b = calculateTextHash('text two')
    expect(a).not.toBe(b)
  })

  it('treats trimmed whitespace as equal', () => {
    const a = calculateTextHash('  hello  ')
    const b = calculateTextHash('hello')
    expect(a).toBe(b)
  })
})
