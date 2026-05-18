'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { flashcardSchema, type FlashcardInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { AudioUploadField, uploadAudioFile } from '@/components/audio/AudioUploadField'
import { TTSOptionsPanel, TTS_STATE_DEFAULT, type TtsState } from '@/components/tts/TTSOptionsPanel'

type ActionResult = { error: string } | { id: string } | undefined

interface FlashcardFormProps {
  defaultValues?: FlashcardInput
  action: (data: FlashcardInput) => Promise<ActionResult>
  onSuccess?: () => void
  onCancel?: () => void
  submitLabel?: string
  showAddAnother?: boolean
  onAddAnother?: (data: FlashcardInput) => Promise<ActionResult>
  // Edit mode
  flashcardId?: string
  frontAudioUrl?: string | null
  frontAudioName?: string | null
  frontAudioSource?: string | null
  backAudioUrl?: string | null
  backAudioName?: string | null
  backAudioSource?: string | null
  // Creation mode: redirect after creation + audio upload
  redirectAfterCreate?: string
}

async function callTtsGenerate(
  flashcardId: string,
  side: 'front' | 'back',
  tts: TtsState
): Promise<void> {
  if (!tts.enabled) return
  await fetch(`/api/tts/${flashcardId}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ side, language: tts.language, voice: tts.voice || undefined }),
  })
  // Errors here are non-fatal — card already saved
}

export function FlashcardForm({
  defaultValues,
  action,
  onSuccess,
  onCancel,
  submitLabel = 'Salvar',
  showAddAnother = false,
  onAddAnother,
  flashcardId,
  frontAudioUrl,
  frontAudioName,
  frontAudioSource,
  backAudioUrl,
  backAudioName,
  backAudioSource,
  redirectAfterCreate,
}: FlashcardFormProps) {
  const router = useRouter()

  const [serverError, setServerError] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const [uploadingAudio, setUploadingAudio] = useState(false)

  // Existing card audio state (edit mode)
  const [currentFrontAudioUrl, setCurrentFrontAudioUrl] = useState(frontAudioUrl)
  const [currentFrontAudioName, setCurrentFrontAudioName] = useState(frontAudioName)
  const [currentBackAudioUrl, setCurrentBackAudioUrl] = useState(backAudioUrl)
  const [currentBackAudioName, setCurrentBackAudioName] = useState(backAudioName)

  // Pending audio files (creation mode, manual upload)
  const [pendingFrontAudio, setPendingFrontAudio] = useState<File | null>(null)
  const [pendingBackAudio, setPendingBackAudio] = useState<File | null>(null)

  // TTS state per side
  const [frontTts, setFrontTts] = useState<TtsState>(TTS_STATE_DEFAULT)
  const [backTts, setBackTts] = useState<TtsState>(TTS_STATE_DEFAULT)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<FlashcardInput>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: defaultValues ?? { frontContent: '', backContent: '' },
  })

  const frontContent = watch('frontContent')
  const backContent = watch('backContent')

  const isCreationMode = !flashcardId
  const hasExistingFrontAudio = !!currentFrontAudioUrl
  const hasExistingBackAudio = !!currentBackAudioUrl
  const busy = isSubmitting || uploadingAudio || frontTts.generating || backTts.generating

  // TTS is disabled when a manual audio already exists for that side
  const frontTtsDisabled = isCreationMode ? !!pendingFrontAudio : hasExistingFrontAudio
  const backTtsDisabled = isCreationMode ? !!pendingBackAudio : hasExistingBackAudio

  function validateTts(tts: TtsState, sideLabel: string): string | null {
    if (!tts.enabled) return null
    if (tts.previewUrl === null) return `Gere o preview de áudio da ${sideLabel} antes de salvar.`
    return null
  }

  async function uploadPendingAudio(cardId: string) {
    const uploads: Promise<void>[] = []
    if (pendingFrontAudio && !frontTts.enabled)
      uploads.push(uploadAudioFile(pendingFrontAudio, cardId, 'front'))
    if (pendingBackAudio && !backTts.enabled)
      uploads.push(uploadAudioFile(pendingBackAudio, cardId, 'back'))
    if (uploads.length > 0) await Promise.all(uploads)
  }

  async function generateTtsAudio(cardId: string) {
    const jobs: Promise<void>[] = []
    if (frontTts.enabled) jobs.push(callTtsGenerate(cardId, 'front', frontTts))
    if (backTts.enabled) jobs.push(callTtsGenerate(cardId, 'back', backTts))
    if (jobs.length > 0) await Promise.all(jobs)
  }

  const onSubmit = async (data: FlashcardInput) => {
    // Validate TTS state before submitting
    const frontTtsError = validateTts(frontTts, 'frente')
    if (frontTtsError) {
      setServerError(frontTtsError)
      return
    }
    const backTtsError = validateTts(backTts, 'verso')
    if (backTtsError) {
      setServerError(backTtsError)
      return
    }

    setServerError(undefined)
    setSuccessMessage(undefined)

    const result = await action(data)

    if (result && 'error' in result) {
      setServerError(result.error)
      return
    }

    // New card created
    if (result && 'id' in result) {
      setUploadingAudio(true)
      try {
        await uploadPendingAudio(result.id)
        await generateTtsAudio(result.id)
      } catch {
        // Non-fatal: card is saved
      } finally {
        setUploadingAudio(false)
      }
      if (redirectAfterCreate) {
        router.push(redirectAfterCreate)
      } else {
        onSuccess?.()
      }
      return
    }

    // Edit mode: generate TTS if enabled
    if (flashcardId) {
      setUploadingAudio(true)
      try {
        await generateTtsAudio(flashcardId)
      } catch {
        // Non-fatal
      } finally {
        setUploadingAudio(false)
      }
    }

    onSuccess?.()
  }

  const onSubmitAndContinue = async (data: FlashcardInput) => {
    if (!onAddAnother) return

    const frontTtsError = validateTts(frontTts, 'frente')
    if (frontTtsError) {
      setServerError(frontTtsError)
      return
    }
    const backTtsError = validateTts(backTts, 'verso')
    if (backTtsError) {
      setServerError(backTtsError)
      return
    }

    setServerError(undefined)
    setSuccessMessage(undefined)

    const result = await onAddAnother(data)

    if (result && 'error' in result) {
      setServerError(result.error)
      return
    }

    if (result && 'id' in result) {
      setUploadingAudio(true)
      try {
        await uploadPendingAudio(result.id)
        await generateTtsAudio(result.id)
      } catch {
        // Non-fatal
      } finally {
        setUploadingAudio(false)
      }
    }

    reset({ frontContent: '', backContent: '' })
    setPendingFrontAudio(null)
    setPendingBackAudio(null)
    setFrontTts(TTS_STATE_DEFAULT)
    setBackTts(TTS_STATE_DEFAULT)
    setSuccessMessage('Card adicionado!')
    setTimeout(() => setSuccessMessage(undefined), 2000)
  }

  const submitLabel_ = uploadingAudio
    ? frontTts.enabled || backTts.enabled
      ? 'Gerando áudio...'
      : 'Enviando áudio...'
    : submitLabel

  return (
    <form className="flex flex-col gap-5">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* ── Front ── */}
      <Controller
        name="frontContent"
        control={control}
        render={({ field, fieldState }) => (
          <RichTextEditor
            value={field.value}
            onChange={field.onChange}
            label="Frente"
            error={fieldState.error?.message}
            placeholder="Pergunta ou termo..."
          />
        )}
      />

      {isCreationMode ? (
        <AudioUploadField
          side="front"
          onFileSelected={(file) => {
            setPendingFrontAudio(file)
            if (file) setFrontTts(TTS_STATE_DEFAULT)
          }}
          disabled={busy || frontTts.enabled}
        />
      ) : (
        <AudioUploadField
          side="front"
          flashcardId={flashcardId}
          existingAudioUrl={currentFrontAudioUrl}
          existingAudioName={currentFrontAudioName}
          onUploadComplete={(_, name) => setCurrentFrontAudioName(name)}
          onDeleteComplete={() => {
            setCurrentFrontAudioUrl(null)
            setCurrentFrontAudioName(null)
          }}
        />
      )}

      <TTSOptionsPanel
        side="front"
        content={frontContent}
        state={frontTts}
        onChange={setFrontTts}
        disabled={frontTtsDisabled}
        disabledReason={
          frontTtsDisabled
            ? isCreationMode
              ? 'Remova o arquivo selecionado para gerar áudio automaticamente.'
              : frontAudioSource === 'generated'
                ? 'Exclua o áudio atual para gerar um novo.'
                : 'Exclua o áudio atual para usar geração automática.'
            : undefined
        }
      />

      {/* ── Back ── */}
      <Controller
        name="backContent"
        control={control}
        render={({ field, fieldState }) => (
          <RichTextEditor
            value={field.value}
            onChange={field.onChange}
            label="Verso"
            error={fieldState.error?.message}
            placeholder="Resposta ou definição..."
          />
        )}
      />

      {isCreationMode ? (
        <AudioUploadField
          side="back"
          onFileSelected={(file) => {
            setPendingBackAudio(file)
            if (file) setBackTts(TTS_STATE_DEFAULT)
          }}
          disabled={busy || backTts.enabled}
        />
      ) : (
        <AudioUploadField
          side="back"
          flashcardId={flashcardId}
          existingAudioUrl={currentBackAudioUrl}
          existingAudioName={currentBackAudioName}
          onUploadComplete={(_, name) => setCurrentBackAudioName(name)}
          onDeleteComplete={() => {
            setCurrentBackAudioUrl(null)
            setCurrentBackAudioName(null)
          }}
        />
      )}

      <TTSOptionsPanel
        side="back"
        content={backContent}
        state={backTts}
        onChange={setBackTts}
        disabled={backTtsDisabled}
        disabledReason={
          backTtsDisabled
            ? isCreationMode
              ? 'Remova o arquivo selecionado para gerar áudio automaticamente.'
              : backAudioSource === 'generated'
                ? 'Exclua o áudio atual para gerar um novo.'
                : 'Exclua o áudio atual para usar geração automática.'
            : undefined
        }
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
        )}

        {showAddAnother && onAddAnother && (
          <Button
            type="button"
            variant="ghost"
            loading={busy}
            onClick={handleSubmit(onSubmitAndContinue)}
          >
            Salvar e adicionar outro
          </Button>
        )}

        <Button type="button" loading={busy} onClick={handleSubmit(onSubmit)}>
          {submitLabel_}
        </Button>
      </div>
    </form>
  )
}
