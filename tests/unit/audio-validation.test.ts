import { describe, it, expect } from 'vitest'
import {
  validateAudioFile,
  buildAudioStoragePath,
  AUDIO_MAX_SIZE_BYTES,
} from '@/lib/audio/audio-validation'

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob(['x'.repeat(Math.min(size, 1))], { type })
  const file = new File([blob], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateAudioFile', () => {
  it('accepts a valid MP3 file', () => {
    const file = makeFile('audio.mp3', 'audio/mpeg', 1024)
    expect(validateAudioFile(file)).toBeNull()
  })

  it('accepts a valid WAV file', () => {
    const file = makeFile('audio.wav', 'audio/wav', 1024)
    expect(validateAudioFile(file)).toBeNull()
  })

  it('rejects unsupported file types', () => {
    const file = makeFile('audio.ogg', 'audio/ogg', 1024)
    expect(validateAudioFile(file)).toMatch(/MP3|WAV/)
  })

  it('rejects files over 10 MB', () => {
    const file = makeFile('big.mp3', 'audio/mpeg', AUDIO_MAX_SIZE_BYTES + 1)
    expect(validateAudioFile(file)).toMatch(/10 MB/)
  })

  it('accepts file exactly at 10 MB limit', () => {
    const file = makeFile('limit.mp3', 'audio/mpeg', AUDIO_MAX_SIZE_BYTES)
    expect(validateAudioFile(file)).toBeNull()
  })
})

describe('buildAudioStoragePath', () => {
  it('builds a path with .mp3 extension for front', () => {
    const path = buildAudioStoragePath('user1', 'card1', 'front', 'my-audio.mp3')
    expect(path).toBe('user1/card1/front.mp3')
  })

  it('builds a path with .wav extension for back', () => {
    const path = buildAudioStoragePath('user1', 'card1', 'back', 'recording.wav')
    expect(path).toBe('user1/card1/back.wav')
  })
})
