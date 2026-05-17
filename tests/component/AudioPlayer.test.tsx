import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AudioPlayer } from '@/components/audio/AudioPlayer'

// jsdom doesn't implement HTMLMediaElement methods
beforeEach(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: vi.fn(),
  })
})

describe('AudioPlayer', () => {
  it('renders without crashing', () => {
    render(<AudioPlayer src="http://example.com/audio.mp3" />)
    // Should show play button
    expect(screen.getByTitle(/Reproduzir/i)).toBeInTheDocument()
  })

  it('shows the provided label', () => {
    render(<AudioPlayer src="http://example.com/audio.mp3" label="Áudio da frente" />)
    expect(screen.getByText('Áudio da frente')).toBeInTheDocument()
  })

  it('shows speed button at default 1x', () => {
    render(<AudioPlayer src="http://example.com/audio.mp3" />)
    expect(screen.getByText('1x')).toBeInTheDocument()
  })

  it('cycles speed when clicking the speed button', async () => {
    const user = userEvent.setup()
    render(<AudioPlayer src="http://example.com/audio.mp3" />)
    const speedBtn = screen.getByText('1x')
    await user.click(speedBtn)
    expect(screen.getByText('1.25x')).toBeInTheDocument()
  })

  it('shows restart button', () => {
    render(<AudioPlayer src="http://example.com/audio.mp3" />)
    expect(screen.getByTitle(/Reiniciar/i)).toBeInTheDocument()
  })
})
