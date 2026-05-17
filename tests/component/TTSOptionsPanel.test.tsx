import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TTSOptionsPanel, TTS_STATE_DEFAULT, type TtsState } from '@/components/tts/TTSOptionsPanel'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_VOICES = [
  {
    shortName: 'en-US-JennyNeural',
    friendlyName: 'Jenny (Neural)',
    gender: 'Female',
    locale: 'en-US',
  },
  { shortName: 'en-US-GuyNeural', friendlyName: 'Guy (Neural)', gender: 'Male', locale: 'en-US' },
]

function mockVoicesResponse() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => MOCK_VOICES,
  })
}

function renderPanel(
  overrides: Partial<TtsState> = {},
  props: Partial<Parameters<typeof TTSOptionsPanel>[0]> = {}
) {
  const state: TtsState = { ...TTS_STATE_DEFAULT, ...overrides }
  const onChange = vi.fn()
  const result = render(
    <TTSOptionsPanel
      side="front"
      content="<p>Hello world</p>"
      state={state}
      onChange={onChange}
      {...props}
    />
  )
  return { ...result, onChange }
}

describe('TTSOptionsPanel', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockVoicesResponse()
  })

  it('renders the enable checkbox', () => {
    renderPanel()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByText(/Gerar áudio da frente automaticamente/)).toBeInTheDocument()
  })

  it('calls onChange with enabled=true when checkbox is clicked', () => {
    const { onChange } = renderPanel()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('does not show language/voice selects when disabled', () => {
    renderPanel({ enabled: false })
    expect(screen.queryByText('Idioma')).not.toBeInTheDocument()
  })

  it('shows language and voice selects when enabled', async () => {
    renderPanel({ enabled: true })
    expect(screen.getByText('Idioma')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Voz')).toBeInTheDocument())
  })

  it('loads voices when enabled', async () => {
    renderPanel({ enabled: true, language: 'en-US' })
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tts/voices?locale=en-US')
      )
    )
  })

  it('shows voice options after loading', async () => {
    renderPanel({ enabled: true, language: 'en-US' })
    await waitFor(() => expect(screen.getByText(/Jenny/)).toBeInTheDocument())
    expect(screen.getByText(/Guy/)).toBeInTheDocument()
  })

  it('shows "Gerar preview" button when enabled', () => {
    renderPanel({ enabled: true })
    expect(screen.getByText('Gerar preview')).toBeInTheDocument()
  })

  it('disables "Gerar preview" button when no voice is selected', () => {
    renderPanel({ enabled: true, voice: '' })
    expect(screen.getByText('Gerar preview')).toBeDisabled()
  })

  it('calls preview API on generate button click', async () => {
    const previewFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        audioDataUrl: 'data:audio/mp3;base64,abc',
        textHash: 'hash123',
        text: 'Hello world',
      }),
    })
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_VOICES }) // voices
      .mockImplementation(previewFetch) // preview

    const { onChange } = renderPanel({ enabled: true, voice: 'en-US-JennyNeural' })

    await waitFor(() => screen.getByText('Gerar preview'))
    fireEvent.click(screen.getByText('Gerar preview'))

    await waitFor(() =>
      expect(previewFetch).toHaveBeenCalledWith(
        '/api/tts/preview',
        expect.objectContaining({ method: 'POST' })
      )
    )
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ previewUrl: 'data:audio/mp3;base64,abc' })
    )
  })

  it('shows error when preview API fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_VOICES })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Serviço indisponível' }) })

    renderPanel({ enabled: true, voice: 'en-US-JennyNeural' })
    await waitFor(() => screen.getByText('Gerar preview'))
    fireEvent.click(screen.getByText('Gerar preview'))

    await waitFor(() => expect(screen.getByText(/Serviço indisponível/)).toBeInTheDocument())
  })

  it('shows content-changed warning when text was edited after preview', () => {
    renderPanel(
      { enabled: true, previewUrl: 'data:audio/mp3;base64,abc', previewContent: '<p>Old text</p>' },
      { content: '<p>New text</p>' }
    )
    expect(screen.getByText(/texto foi alterado/)).toBeInTheDocument()
  })

  it('does not show content-changed warning when text matches preview', () => {
    renderPanel(
      {
        enabled: true,
        previewUrl: 'data:audio/mp3;base64,abc',
        previewContent: '<p>Hello world</p>',
      },
      { content: '<p>Hello world</p>' }
    )
    expect(screen.queryByText(/texto foi alterado/)).not.toBeInTheDocument()
  })

  it('shows disabled reason when disabled prop is true', () => {
    renderPanel({ enabled: false }, { disabled: true, disabledReason: 'Remova o arquivo.' })
    expect(screen.getByText('Remova o arquivo.')).toBeInTheDocument()
  })

  it('does not call onChange when disabled and checkbox is clicked', () => {
    const { onChange } = renderPanel({}, { disabled: true })
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows "verso" label for back side', () => {
    const onChange = vi.fn()
    render(
      <TTSOptionsPanel side="back" content="hello" state={TTS_STATE_DEFAULT} onChange={onChange} />
    )
    expect(screen.getByText(/Gerar áudio do verso/)).toBeInTheDocument()
  })
})
