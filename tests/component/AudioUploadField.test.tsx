import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AudioUploadField } from '@/components/audio/AudioUploadField'

describe('AudioUploadField', () => {
  it('renders file select button when no existing audio', () => {
    render(<AudioUploadField side="front" />)
    expect(screen.getByText(/Selecionar arquivo/i)).toBeInTheDocument()
  })

  it('shows correct side label', () => {
    render(<AudioUploadField side="back" />)
    expect(screen.getByText(/Verso/i)).toBeInTheDocument()
  })

  it('shows the format hint', () => {
    render(<AudioUploadField side="front" />)
    expect(screen.getByText(/MP3 ou WAV/i)).toBeInTheDocument()
  })

  it('shows remove button when existing audio is provided', () => {
    render(
      <AudioUploadField
        side="front"
        flashcardId="card-1"
        existingAudioUrl="http://example.com/audio.mp3"
        existingAudioName="audio.mp3"
      />
    )
    expect(screen.getByText(/Remover/i)).toBeInTheDocument()
  })

  it('shows error for invalid file type', async () => {
    const user = userEvent.setup()
    render(<AudioUploadField side="front" />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'audio.ogg', { type: 'audio/ogg' })
    await user.upload(input, file)

    expect(await screen.findByText(/MP3|WAV/i)).toBeInTheDocument()
  })
})
