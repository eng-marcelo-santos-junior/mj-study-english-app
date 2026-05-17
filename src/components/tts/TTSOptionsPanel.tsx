'use client'

import { useState, useEffect } from 'react'
import { Sparkles, AlertTriangle } from 'lucide-react'
import { AudioPlayer } from '@/components/audio/AudioPlayer'

export interface TtsState {
  enabled: boolean
  language: string
  voice: string
  previewUrl: string | null
  previewContent: string | null
  generating: boolean
}

export const TTS_STATE_DEFAULT: TtsState = {
  enabled: false,
  language: 'en-US',
  voice: '',
  previewUrl: null,
  previewContent: null,
  generating: false,
}

interface Voice {
  shortName: string
  friendlyName: string
  gender: string
  locale: string
}

const LANGUAGES = [
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

interface TTSOptionsPanelProps {
  side: 'front' | 'back'
  content: string
  state: TtsState
  onChange: (state: TtsState) => void
  disabled?: boolean
  disabledReason?: string
}

export function TTSOptionsPanel({
  side,
  content,
  state,
  onChange,
  disabled = false,
  disabledReason,
}: TTSOptionsPanelProps) {
  // Track which locale voices were loaded for, so loading state is derived
  // (avoids synchronous setState inside useEffect).
  const [voicesLocale, setVoicesLocale] = useState<string | null>(null)
  const [voices, setVoices] = useState<Voice[]>([])
  const [voicesError, setVoicesError] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const sideLabel = side === 'front' ? 'da frente' : 'do verso'
  const voicesLoading = state.enabled && voicesLocale !== state.language && !voicesError
  const contentChanged =
    state.enabled && state.previewContent !== null && state.previewContent !== content

  useEffect(() => {
    if (!state.enabled) return
    const locale = state.language
    let active = true

    fetch(`/api/tts/voices?locale=${locale}`)
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar vozes')
        return res.json() as Promise<Voice[]>
      })
      .then((data) => {
        if (active) {
          setVoices(data)
          setVoicesLocale(locale)
          setVoicesError(null)
        }
      })
      .catch(() => {
        if (active) setVoicesError('Não foi possível carregar as vozes. Verifique sua conexão.')
      })

    return () => {
      active = false
    }
  }, [state.enabled, state.language])

  const handleToggle = () => {
    if (disabled) return
    onChange({ ...TTS_STATE_DEFAULT, enabled: !state.enabled, language: state.language })
  }

  const handleLanguageChange = (language: string) => {
    onChange({ ...state, language, voice: '', previewUrl: null, previewContent: null })
  }

  const handleVoiceChange = (voice: string) => {
    onChange({ ...state, voice, previewUrl: null, previewContent: null })
  }

  const handleGeneratePreview = async () => {
    if (!content.trim()) {
      setPreviewError('Digite um texto antes de gerar o áudio.')
      return
    }
    if (!state.voice) {
      setPreviewError('Selecione uma voz para continuar.')
      return
    }

    setPreviewError(null)
    onChange({ ...state, generating: true, previewUrl: null, previewContent: null })

    try {
      const res = await fetch('/api/tts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, voice: state.voice }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPreviewError(data.error ?? 'Não foi possível gerar o áudio. Tente novamente.')
        onChange({ ...state, generating: false })
        return
      }
      onChange({
        ...state,
        generating: false,
        previewUrl: data.audioDataUrl,
        previewContent: content,
      })
    } catch {
      setPreviewError('Não foi possível gerar o áudio. Tente novamente.')
      onChange({ ...state, generating: false })
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      {/* Toggle */}
      <label
        className={`flex cursor-pointer items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={handleToggle}
          disabled={disabled || state.generating}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          Gerar áudio {sideLabel} automaticamente
        </span>
      </label>

      {disabledReason && disabled && <p className="text-xs text-amber-600">{disabledReason}</p>}

      {state.enabled && !disabled && (
        <div className="space-y-3 pl-6">
          {/* Language */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Idioma</label>
            <select
              value={state.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={state.generating}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Voice */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Voz</label>
            {voicesLoading ? (
              <p className="text-xs text-gray-400">Carregando vozes...</p>
            ) : voicesError ? (
              <p className="text-xs text-red-500">{voicesError}</p>
            ) : (
              <select
                value={state.voice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                disabled={state.generating || voices.length === 0}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">— Selecione uma voz —</option>
                {voices.map((v) => (
                  <option key={v.shortName} value={v.shortName}>
                    {v.friendlyName} ({v.gender === 'Female' ? 'Feminina' : 'Masculina'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Preview error */}
          {previewError && <p className="text-xs text-red-500">{previewError}</p>}

          {/* Text changed warning */}
          {contentChanged && (
            <div className="flex items-start gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />O texto foi alterado depois
              da geração do áudio. Gere o preview novamente antes de salvar.
            </div>
          )}

          {/* Generate preview button */}
          <button
            type="button"
            onClick={handleGeneratePreview}
            disabled={state.generating || !state.voice}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {state.generating ? 'Gerando preview...' : 'Gerar preview'}
          </button>

          {/* Preview audio player */}
          {state.previewUrl && !contentChanged && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-green-600 dark:text-green-400">
                Áudio gerado com sucesso. Ouça antes de salvar:
              </p>
              <AudioPlayer
                src={state.previewUrl}
                label={`Preview — ${state.voice}`}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
