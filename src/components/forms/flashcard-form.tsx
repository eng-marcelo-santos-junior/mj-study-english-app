'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { flashcardSchema, type FlashcardInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { AudioUploadField, uploadAudioFile } from '@/components/audio/AudioUploadField'

type ActionResult = { error: string } | { id: string } | undefined

interface FlashcardFormProps {
  defaultValues?: FlashcardInput
  action: (data: FlashcardInput) => Promise<ActionResult>
  onSuccess?: () => void
  onCancel?: () => void
  submitLabel?: string
  showAddAnother?: boolean
  onAddAnother?: (data: FlashcardInput) => Promise<ActionResult>
  // Existing card (edit mode)
  flashcardId?: string
  frontAudioUrl?: string | null
  frontAudioName?: string | null
  backAudioUrl?: string | null
  backAudioName?: string | null
  // New card (creation mode): redirect here after creation + audio upload
  redirectAfterCreate?: string
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
  backAudioUrl,
  backAudioName,
  redirectAfterCreate,
}: FlashcardFormProps) {
  const router = useRouter()

  const [serverError, setServerError] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const [uploadingAudio, setUploadingAudio] = useState(false)

  // Existing card audio state
  const [currentFrontAudioUrl, setCurrentFrontAudioUrl] = useState(frontAudioUrl)
  const [currentFrontAudioName, setCurrentFrontAudioName] = useState(frontAudioName)
  const [currentBackAudioUrl, setCurrentBackAudioUrl] = useState(backAudioUrl)
  const [currentBackAudioName, setCurrentBackAudioName] = useState(backAudioName)

  // Pending audio files (new card creation)
  const [pendingFrontAudio, setPendingFrontAudio] = useState<File | null>(null)
  const [pendingBackAudio, setPendingBackAudio] = useState<File | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FlashcardInput>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: defaultValues ?? { frontContent: '', backContent: '' },
  })

  const isCreationMode = !flashcardId
  const busy = isSubmitting || uploadingAudio

  async function uploadPendingAudio(cardId: string) {
    const uploads: Promise<void>[] = []
    if (pendingFrontAudio) uploads.push(uploadAudioFile(pendingFrontAudio, cardId, 'front'))
    if (pendingBackAudio) uploads.push(uploadAudioFile(pendingBackAudio, cardId, 'back'))
    if (uploads.length > 0) await Promise.all(uploads)
  }

  const onSubmit = async (data: FlashcardInput) => {
    setServerError(undefined)
    setSuccessMessage(undefined)

    const result = await action(data)

    if (result && 'error' in result) {
      setServerError(result.error)
      return
    }

    // New card created — upload pending audio then redirect
    if (result && 'id' in result) {
      if (pendingFrontAudio || pendingBackAudio) {
        setUploadingAudio(true)
        try {
          await uploadPendingAudio(result.id)
        } catch {
          // Audio upload failed — card still saved, don't block
        } finally {
          setUploadingAudio(false)
        }
      }
      if (redirectAfterCreate) {
        router.push(redirectAfterCreate)
      } else {
        onSuccess?.()
      }
      return
    }

    // Edit mode: no return value
    onSuccess?.()
  }

  const onSubmitAndContinue = async (data: FlashcardInput) => {
    if (!onAddAnother) return
    setServerError(undefined)
    setSuccessMessage(undefined)

    const result = await onAddAnother(data)

    if (result && 'error' in result) {
      setServerError(result.error)
      return
    }

    // New card created — upload pending audio then reset
    if (result && 'id' in result) {
      if (pendingFrontAudio || pendingBackAudio) {
        setUploadingAudio(true)
        try {
          await uploadPendingAudio(result.id)
        } catch {
          // ignore
        } finally {
          setUploadingAudio(false)
        }
      }
    }

    reset({ frontContent: '', backContent: '' })
    setPendingFrontAudio(null)
    setPendingBackAudio(null)
    setSuccessMessage('Card adicionado!')
    setTimeout(() => setSuccessMessage(undefined), 2000)
  }

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
        <AudioUploadField side="front" onFileSelected={setPendingFrontAudio} disabled={busy} />
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
        <AudioUploadField side="back" onFileSelected={setPendingBackAudio} disabled={busy} />
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
          {uploadingAudio ? 'Enviando áudio...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
