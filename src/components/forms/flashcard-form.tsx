'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { flashcardSchema, type FlashcardInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { AudioUploadField } from '@/components/audio/AudioUploadField'

interface FlashcardFormProps {
  defaultValues?: FlashcardInput
  action: (data: FlashcardInput) => Promise<{ error: string } | undefined>
  onSuccess?: () => void
  onCancel?: () => void
  submitLabel?: string
  showAddAnother?: boolean
  onAddAnother?: (data: FlashcardInput) => Promise<{ error: string } | undefined>
  // Audio props (only available in edit mode)
  flashcardId?: string
  frontAudioUrl?: string | null
  frontAudioName?: string | null
  backAudioUrl?: string | null
  backAudioName?: string | null
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
}: FlashcardFormProps) {
  const [serverError, setServerError] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const [currentFrontAudioUrl, setCurrentFrontAudioUrl] = useState(frontAudioUrl)
  const [currentFrontAudioName, setCurrentFrontAudioName] = useState(frontAudioName)
  const [currentBackAudioUrl, setCurrentBackAudioUrl] = useState(backAudioUrl)
  const [currentBackAudioName, setCurrentBackAudioName] = useState(backAudioName)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FlashcardInput>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: defaultValues ?? { frontContent: '', backContent: '' },
  })

  const onSubmit = async (data: FlashcardInput) => {
    setServerError(undefined)
    setSuccessMessage(undefined)
    const result = await action(data)
    if (result?.error) {
      setServerError(result.error)
      return
    }
    onSuccess?.()
  }

  const onSubmitAndContinue = async (data: FlashcardInput) => {
    if (!onAddAnother) return
    setServerError(undefined)
    setSuccessMessage(undefined)
    const result = await onAddAnother(data)
    if (result?.error) {
      setServerError(result.error)
      return
    }
    reset({ frontContent: '', backContent: '' })
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

      {flashcardId ? (
        <AudioUploadField
          side="front"
          flashcardId={flashcardId}
          existingAudioUrl={currentFrontAudioUrl}
          existingAudioName={currentFrontAudioName}
          onUploadComplete={(_, name) => {
            setCurrentFrontAudioName(name)
            // URL refreshed on next page load via signed URL
          }}
          onDeleteComplete={() => {
            setCurrentFrontAudioUrl(null)
            setCurrentFrontAudioName(null)
          }}
        />
      ) : (
        <p className="text-xs text-gray-400">Salve o card para adicionar áudio à frente.</p>
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

      {flashcardId ? (
        <AudioUploadField
          side="back"
          flashcardId={flashcardId}
          existingAudioUrl={currentBackAudioUrl}
          existingAudioName={currentBackAudioName}
          onUploadComplete={(_, name) => {
            setCurrentBackAudioName(name)
          }}
          onDeleteComplete={() => {
            setCurrentBackAudioUrl(null)
            setCurrentBackAudioName(null)
          }}
        />
      ) : (
        <p className="text-xs text-gray-400">Salve o card para adicionar áudio ao verso.</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}

        {showAddAnother && onAddAnother && (
          <Button
            type="button"
            variant="ghost"
            loading={isSubmitting}
            onClick={handleSubmit(onSubmitAndContinue)}
          >
            Salvar e adicionar outro
          </Button>
        )}

        <Button type="button" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
